import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from "@nestjs/common";
import {
  MessageType,
  Prisma,
  RelationshipStatus,
  ReservationIntentSource,
  ReservationIntentStatus,
} from "@prisma/client";
import type { CommerceThreadDraftDiagnostics, ConversationalOrderDraftResponse } from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { CommerceThreadAccessPolicy } from "../commerce-thread-access/commerce-thread-access.policy";
import {
  draftAnchorsClearedFromReject,
  extractQuantity,
  looksLikeReservationAsk,
  makeEmptyDraft,
  parseDraftFromJson,
  reduceDraftWithMessage,
  reservationHoldHours,
} from "./conversational-order-draft.engine";
import { RelationalNegotiationDraftRealtimePublishService } from "./relational-negotiation-draft-realtime-publish.service";
import { CommercialTrustTouchService } from "../commercial-trust/commercial-trust-touch.service";
import { RelationshipGovernanceService } from "../relationship-governance/relationship-governance.service";
import { RelationalCartService } from "../relational-cart/relational-cart.service";

@Injectable()
export class RelationalNegotiationDraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly realtime: RelationalNegotiationDraftRealtimePublishService,
    private readonly threadAccess: CommerceThreadAccessPolicy,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
    @Optional() private readonly corridorGovernance?: RelationshipGovernanceService,
    @Optional() private readonly relationalCart?: RelationalCartService,
  ) {}

  private diagnostics(
    actor: CommerceThreadResolvedActor,
    partial: Partial<CommerceThreadDraftDiagnostics> & Pick<CommerceThreadDraftDiagnostics, "relationshipValidationSource">,
  ): CommerceThreadDraftDiagnostics {
    return {
      actorResolvedFrom: actor.actorResolvedFrom,
      bodyActorTrusted: false,
      threadMembershipValidated: true,
      relationshipValidated: partial.relationshipValidated ?? false,
      corridorValidated: partial.corridorValidated ?? false,
      relationshipValidationSource: partial.relationshipValidationSource,
      rejectedByRelationshipValidationCount: partial.rejectedByRelationshipValidationCount ?? 0,
      hardAcceptedStatusWritten: partial.hardAcceptedStatusWritten ?? false,
      negotiationStatusMutation: partial.negotiationStatusMutation ?? "NONE",
    };
  }

  private async findAcceptedCorridorRelationship(thread: {
    buyerOrganizationId: string | null;
    sellerOrganizationId: string | null;
  }): Promise<{ id: string } | null> {
    const buyer = thread.buyerOrganizationId;
    const seller = thread.sellerOrganizationId;
    if (!buyer || !seller) return null;
    return this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          { AND: [{ requesterOrganizationId: buyer }, { receiverOrganizationId: seller }] },
          { AND: [{ requesterOrganizationId: seller }, { receiverOrganizationId: buyer }] },
          { AND: [{ upstreamOrganizationId: buyer }, { downstreamOrganizationId: seller }] },
          { AND: [{ upstreamOrganizationId: seller }, { downstreamOrganizationId: buyer }] },
        ],
      },
      select: { id: true },
    });
  }

  async getDraftSnapshot(threadId: string, actor: CommerceThreadResolvedActor): Promise<ConversationalOrderDraftResponse> {
    await this.threadAccess.assertCanReadThread(actor, threadId);
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        negotiationId: true,
        productId: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        conversationalOrderDraft: true,
      },
    });
    if (!thread) throw new NotFoundException(threadId);

    const rel = await this.findAcceptedCorridorRelationship(thread);
    const enabled = await this.flags.isEnabled("relational_negotiation_draft_v1", {
      organizationId: actor.organizationId,
    });
    let draft = parseDraftFromJson(thread.conversationalOrderDraft);
    draft = {
      ...draft,
      buyerOrganizationId: thread.buyerOrganizationId,
      sellerOrganizationId: thread.sellerOrganizationId,
      relationshipId: rel?.id ?? null,
    };

    return {
      threadId: thread.id,
      negotiationId: thread.negotiationId,
      productId: thread.productId,
      draft,
      policy: enabled ? "ACTIVE" : "DISABLED",
      diagnostics: this.diagnostics(actor, {
        relationshipValidated: Boolean(rel),
        corridorValidated: Boolean(rel),
        relationshipValidationSource: rel ? "RESOLVED_BY_ORG_PAIR" : "NONE",
        rejectedByRelationshipValidationCount: 0,
        hardAcceptedStatusWritten: false,
        negotiationStatusMutation: "NONE",
      }),
    };
  }

  async processAfterInboundMessage(threadId: string, messageId: string): Promise<void> {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 80 },
      },
    });
    if (!thread) return;
    const orgForFlag =
      thread.buyerOrganizationId ?? thread.sellerOrganizationId ?? thread.messages[0]?.senderOrganizationId;
    const enabled = await this.flags.isEnabled("relational_negotiation_draft_v1", { organizationId: orgForFlag });
    if (!enabled) return;

    const latest = thread.messages.find((m) => m.id === messageId);
    if (!latest) return;

    const rel = await this.findAcceptedCorridorRelationship(thread);

    const prev = parseDraftFromJson(thread.conversationalOrderDraft);
    const messagesAsc = thread.messages.map((m) => ({
      id: m.id,
      senderOrganizationId: m.senderOrganizationId,
      messageType: String(m.messageType),
      content: m.content,
      createdAt: m.createdAt,
    }));

    let draft = reduceDraftWithMessage({
      draft: prev,
      messagesAsc,
      latest: {
        id: latest.id,
        senderOrganizationId: latest.senderOrganizationId,
        messageType: String(latest.messageType),
        content: latest.content,
        createdAt: latest.createdAt,
      },
      thread: {
        productId: thread.productId,
        buyerOrganizationId: thread.buyerOrganizationId,
        sellerOrganizationId: thread.sellerOrganizationId,
        relationshipId: rel?.id ?? null,
      },
    });

    if (
      latest.messageType === MessageType.TEXT &&
      latest.content &&
      looksLikeReservationAsk(latest.content) &&
      thread.productId &&
      thread.negotiationId &&
      extractQuantity(latest.content)
    ) {
      const q = extractQuantity(latest.content)!.value;
      const hours = reservationHoldHours(latest.content);
      const expiresAt = new Date(Date.now() + hours * 3600_000);
      const ri = await this.prisma.reservationIntent.create({
        data: {
          organizationId: latest.senderOrganizationId,
          productId: thread.productId,
          negotiationId: thread.negotiationId,
          requestedQuantity: new Prisma.Decimal(q),
          status: ReservationIntentStatus.REQUESTED,
          expiresAt,
          source: ReservationIntentSource.CONVERSATIONAL_SYMBOLIC_DRAFT,
          metadata: {
            threadId,
            symbolic: true,
            conversationalHeuristic: true,
            requiresHumanConfirmation: true,
            notStockReservation: true,
            note: "Réservation symbolique 20.1A — pas de stock WMS, pas de commande.",
          } as Prisma.InputJsonValue,
        },
      });
      draft = {
        ...draft,
        negotiationState: "RESERVATION_PENDING",
        lastSymbolicReservationIntentId: ri.id,
        reservationIntentSafetyMode: "STRICT_SYMBOLIC",
      };
      await this.realtime.publish(threadId, orgForFlag ?? latest.senderOrganizationId, "reservation.created", {
        reservationIntentId: ri.id,
      });
    }

    await this.prisma.messageThread.update({
      where: { id: threadId },
      data: { conversationalOrderDraft: draft as unknown as Prisma.InputJsonValue },
    });

    await this.realtime.publish(threadId, orgForFlag ?? latest.senderOrganizationId, "negotiation.updated", {
      negotiationState: draft.negotiationState,
    });
    await this.realtime.publish(threadId, orgForFlag ?? latest.senderOrganizationId, "draft.updated", { draft });
    if (draft.negotiationState === "DRAFT_READY") {
      await this.realtime.publish(threadId, orgForFlag ?? latest.senderOrganizationId, "draft.ready", { draft });
    }
  }

  private async assertCorridorForConfirm(thread: {
    id: string;
    buyerOrganizationId: string | null;
    sellerOrganizationId: string | null;
    negotiationId: string | null;
  }): Promise<{ relationshipId: string }> {
    const rel = await this.findAcceptedCorridorRelationship(thread);
    if (!rel) {
      throw new ForbiddenException({
        code: "relationship_corridor_required",
        detail: "Instruction 20.1A — accepted buyer/seller relationship required before human draft confirm",
      });
    }
    if (!thread.negotiationId) {
      throw new BadRequestException("negotiation_required_for_confirm");
    }
    const neg = await this.prisma.negotiation.findUnique({
      where: { id: thread.negotiationId },
      select: {
        id: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        productId: true,
      },
    });
    if (!neg) throw new NotFoundException(thread.negotiationId);
    if (
      neg.buyerOrganizationId !== thread.buyerOrganizationId ||
      neg.sellerOrganizationId !== thread.sellerOrganizationId
    ) {
      throw new ForbiddenException({
        code: "negotiation_thread_corridor_mismatch",
        detail: "Negotiation buyer/seller must match thread organizations",
      });
    }
    return { relationshipId: rel.id };
  }

  async confirmDraftHuman(input: {
    threadId: string;
    actor: CommerceThreadResolvedActor;
  }): Promise<ConversationalOrderDraftResponse> {
    await this.threadAccess.assertCanConfirmNegotiationDraft(input.actor, input.threadId);
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: input.threadId },
      select: {
        id: true,
        negotiationId: true,
        productId: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        conversationalOrderDraft: true,
      },
    });
    if (!thread) throw new NotFoundException(input.threadId);

    const enabled = await this.flags.isEnabled("relational_negotiation_draft_v1", {
      organizationId: input.actor.organizationId,
    });
    if (!enabled) throw new BadRequestException("feature_disabled");

    let draft = parseDraftFromJson(thread.conversationalOrderDraft);
    if (draft.negotiationState !== "DRAFT_READY" && draft.negotiationState !== "IMPLICIT_ACCEPTANCE") {
      throw new BadRequestException("draft_not_ready_for_human_confirm");
    }

    const corridor = await this.assertCorridorForConfirm(thread);

    const qty = draft.workingTerms.quantity;
    const price = draft.workingTerms.unitPrice;
    const unit = draft.workingTerms.quantityUnit;
    if (qty == null || price == null || !unit || !thread.productId) {
      throw new BadRequestException("draft_incomplete");
    }

    const negRow = await this.prisma.negotiation.findUnique({
      where: { id: thread.negotiationId! },
      select: { negotiationDraftMetadata: true },
    });
    const prevMeta =
      negRow?.negotiationDraftMetadata && typeof negRow.negotiationDraftMetadata === "object"
        ? (negRow.negotiationDraftMetadata as Record<string, unknown>)
        : {};

    const createdMsg = await this.prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: thread.negotiationId! },
        data: {
          negotiationDraftMetadata: {
            ...prevMeta,
            conversationalDraftConfirmed: true,
            conversationalDraftConfirmedAt: new Date().toISOString(),
            conversationalDraftConfirmedByUserId: input.actor.userId,
            conversationalDraftConfirmedByOrganizationId: input.actor.organizationId,
            conversationalDraftRelationshipId: corridor.relationshipId,
            conversationalDraftTerms: {
              quantity: qty,
              quantityUnit: unit,
              unitPrice: price,
              currency: draft.workingTerms.currency,
              productId: thread.productId,
            },
            heuristicOnly: true,
            hardNegotiationStatusChange: false,
          } as Prisma.InputJsonValue,
        },
      });
      return tx.message.create({
        data: {
          threadId: input.threadId,
          senderUserId: input.actor.userId,
          senderOrganizationId: input.actor.organizationId,
          messageType: MessageType.SYSTEM_EVENT,
          content:
            "Brouillon confirmé par geste humain — métadonnée négociation seule (20.1A) ; pas de statut ACCEPTED automatique, pas de commande ni paiement.",
          structuredEvent: {
            kind: "conversational_draft_human_confirm",
            quantity: qty,
            unitPrice: price,
            currency: draft.workingTerms.currency,
            quantityUnit: unit,
            heuristicOnly: true,
            negotiationStatusMutation: "METADATA_ONLY",
          } as Prisma.InputJsonValue,
        },
      });
    });

    await this.relationalCart?.createCartFromConversationalDraft({
      threadId: input.threadId,
      relationshipId: corridor.relationshipId,
      actorUserId: input.actor.userId,
      actorOrganizationId: input.actor.organizationId,
      negotiationId: thread.negotiationId!,
      productId: thread.productId!,
      quantity: qty,
      unitPrice: price,
      quantityUnit: unit,
      currency: draft.workingTerms.currency,
      sourceMessageId: createdMsg.id,
    });

    draft = {
      ...draft,
      negotiationState: "DRAFT_CONFIRMED",
      readinessNote: "NONE",
      requiresHumanValidation: false,
      relationshipId: corridor.relationshipId,
      negotiationStatusMutation: "METADATA_ONLY",
      conversionStatus: "DRAFT_CONFIRMED",
      convertibleToOrder: false,
      revisionHistory: [
        ...draft.revisionHistory,
        {
          at: new Date().toISOString(),
          messageId: null,
          organizationId: input.actor.organizationId,
          kind: "HUMAN_STRIP_CONFIRM" as const,
          summary: "Glisser / confirmer humain — écriture métadonnées négociation uniquement (20.1A).",
        },
      ].slice(-200),
    };

    await this.prisma.messageThread.update({
      where: { id: input.threadId },
      data: { conversationalOrderDraft: draft as unknown as Prisma.InputJsonValue },
    });

    await this.realtime.publish(input.threadId, input.actor.organizationId, "draft.human_confirmed", {
      metadataOnly: true,
    });
    await this.realtime.publish(input.threadId, input.actor.organizationId, "draft.updated", { draft });

    const orgs = [thread.buyerOrganizationId, thread.sellerOrganizationId].filter(Boolean) as string[];
    this.trustTouch?.touchOrganizations(orgs);
    this.corridorGovernance?.touchRelationship(corridor.relationshipId);

    return {
      threadId: thread.id,
      negotiationId: thread.negotiationId,
      productId: thread.productId,
      draft,
      policy: "ACTIVE",
      diagnostics: this.diagnostics(input.actor, {
        relationshipValidated: true,
        corridorValidated: true,
        relationshipValidationSource: "RESOLVED_BY_ORG_PAIR",
        rejectedByRelationshipValidationCount: 0,
        hardAcceptedStatusWritten: false,
        negotiationStatusMutation: "METADATA_ONLY",
      }),
    };
  }

  async rejectDraftHuman(input: { threadId: string; actor: CommerceThreadResolvedActor }): Promise<ConversationalOrderDraftResponse> {
    await this.threadAccess.assertCanWriteThread(input.actor, input.threadId);
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: input.threadId },
      select: {
        id: true,
        negotiationId: true,
        productId: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        conversationalOrderDraft: true,
      },
    });
    if (!thread) throw new NotFoundException(input.threadId);

    const enabled = await this.flags.isEnabled("relational_negotiation_draft_v1", {
      organizationId: input.actor.organizationId,
    });
    if (!enabled) throw new BadRequestException("feature_disabled");

    const rel = await this.findAcceptedCorridorRelationship(thread);
    const prev = parseDraftFromJson(thread.conversationalOrderDraft);
    let draft = draftAnchorsClearedFromReject(prev, input.actor.organizationId);

    await this.prisma.message.create({
      data: {
        threadId: input.threadId,
        senderUserId: input.actor.userId,
        senderOrganizationId: input.actor.organizationId,
        messageType: MessageType.SYSTEM_EVENT,
        content: "Brouillon relationnel rejeté côté humain — ancres effacées ; messages du fil conservés.",
        structuredEvent: { kind: "conversational_draft_human_reject" } as Prisma.InputJsonValue,
      },
    });

    await this.prisma.messageThread.update({
      where: { id: input.threadId },
      data: { conversationalOrderDraft: draft as unknown as Prisma.InputJsonValue },
    });

    await this.realtime.publish(input.threadId, input.actor.organizationId, "negotiation.rejected", {});
    await this.realtime.publish(input.threadId, input.actor.organizationId, "draft.updated", { draft });

    return {
      threadId: thread.id,
      negotiationId: thread.negotiationId,
      productId: thread.productId,
      draft,
      policy: "ACTIVE",
      diagnostics: this.diagnostics(input.actor, {
        relationshipValidated: Boolean(rel),
        corridorValidated: Boolean(rel),
        relationshipValidationSource: rel ? "RESOLVED_BY_ORG_PAIR" : "NONE",
        rejectedByRelationshipValidationCount: 0,
        hardAcceptedStatusWritten: false,
        negotiationStatusMutation: "NONE",
      }),
    };
  }
}
