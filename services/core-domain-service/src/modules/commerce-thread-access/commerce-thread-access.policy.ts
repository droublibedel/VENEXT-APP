import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { RelationshipStatus, TemporaryCommercialHandshakeState, ThreadType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommerceThreadResolvedActor } from "./commerce-thread-actor-resolver.service";

export type CommerceMessagingAccessDiagnostics = {
  actorResolvedFrom: "AUTH_CONTEXT" | "DEV_FALLBACK";
  bodyActorTrusted: false;
  threadMembershipValidated: boolean;
  threadWriteValidated: boolean;
  commercialConsistencyValidated: boolean;
  rejectedByThreadAccessCount: number;
  rejectedByOrganizationMismatch: number;
  rejectedByRelationshipMismatch: number;
};

type ThreadWithNav = {
  id: string;
  threadType: ThreadType;
  productId: string | null;
  negotiationId: string | null;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  sponsoredConversationWindowId: string | null;
  negotiation: {
    id: string;
    productId: string;
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    status: string;
  } | null;
  product: { id: string; organizationId: string } | null;
  sponsoredConversationWindow: {
    id: string;
    state: TemporaryCommercialHandshakeState;
    expiresAt: Date;
    campaignId: string;
    sponsorOrganizationId: string;
    targetOrganizationId: string;
    productId: string;
    temporaryConversationAllowed: boolean;
    relationshipId: string | null;
  } | null;
};

/**
 * Instruction 20.1B — unified thread access + corridor consistency for commerce-messaging.
 */
@Injectable()
export class CommerceThreadAccessPolicy {
  constructor(private readonly prisma: PrismaService) {}

  freshDiagnostics(actor: CommerceThreadResolvedActor): CommerceMessagingAccessDiagnostics {
    return {
      actorResolvedFrom: actor.actorResolvedFrom,
      bodyActorTrusted: false,
      threadMembershipValidated: true,
      threadWriteValidated: false,
      commercialConsistencyValidated: false,
      rejectedByThreadAccessCount: 0,
      rejectedByOrganizationMismatch: 0,
      rejectedByRelationshipMismatch: 0,
    };
  }

  async assertCanReadThread(actor: CommerceThreadResolvedActor, threadId: string): Promise<CommerceMessagingAccessDiagnostics> {
    const thread = await this.loadThreadOrThrow(threadId);
    this.assertParticipant(actor, thread);
    const consistent = await this.validateConversationCommercialConsistency(thread);
    const d = this.freshDiagnostics(actor);
    d.threadWriteValidated = false;
    d.commercialConsistencyValidated = consistent;
    return d;
  }

  async assertCanWriteThread(actor: CommerceThreadResolvedActor, threadId: string): Promise<CommerceMessagingAccessDiagnostics> {
    const d = await this.assertCanReadThread(actor, threadId);
    if (!d.commercialConsistencyValidated) {
      throw new BadRequestException({ code: "commercial_thread_inconsistent" });
    }
    d.threadWriteValidated = true;
    return d;
  }

  async assertCanConfirmNegotiationDraft(actor: CommerceThreadResolvedActor, threadId: string): Promise<CommerceMessagingAccessDiagnostics> {
    return this.assertCanWriteThread(actor, threadId);
  }

  /** Used by internal WS subscribe validation (gateway → core). */
  async validateWsSubscribe(actor: CommerceThreadResolvedActor, threadId: string): Promise<CommerceMessagingAccessDiagnostics> {
    return this.assertCanReadThread(actor, threadId);
  }

  async findAcceptedRelationship(buyerOrganizationId: string, sellerOrganizationId: string) {
    return this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          { AND: [{ requesterOrganizationId: buyerOrganizationId }, { receiverOrganizationId: sellerOrganizationId }] },
          { AND: [{ requesterOrganizationId: sellerOrganizationId }, { receiverOrganizationId: buyerOrganizationId }] },
          { AND: [{ upstreamOrganizationId: buyerOrganizationId }, { downstreamOrganizationId: sellerOrganizationId }] },
          { AND: [{ upstreamOrganizationId: sellerOrganizationId }, { downstreamOrganizationId: buyerOrganizationId }] },
        ],
      },
      select: { id: true },
    });
  }

  private async loadThreadOrThrow(threadId: string): Promise<ThreadWithNav> {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        negotiation: {
          select: {
            id: true,
            productId: true,
            buyerOrganizationId: true,
            sellerOrganizationId: true,
            status: true,
          },
        },
        product: { select: { id: true, organizationId: true } },
        sponsoredConversationWindow: {
          select: {
            id: true,
            state: true,
            expiresAt: true,
            campaignId: true,
            sponsorOrganizationId: true,
            targetOrganizationId: true,
            productId: true,
            temporaryConversationAllowed: true,
            relationshipId: true,
          },
        },
      },
    });
    if (!thread) throw new NotFoundException(threadId);
    return thread as ThreadWithNav;
  }

  private assertParticipant(actor: CommerceThreadResolvedActor, thread: { buyerOrganizationId: string | null; sellerOrganizationId: string | null }) {
    if (
      actor.organizationId !== thread.buyerOrganizationId &&
      actor.organizationId !== thread.sellerOrganizationId
    ) {
      throw new ForbiddenException({ code: "venext_commerce_thread_access_denied" });
    }
  }

  async validateConversationCommercialConsistency(thread: ThreadWithNav): Promise<boolean> {
    if (!thread.buyerOrganizationId || !thread.sellerOrganizationId) return false;

    if (thread.threadType === ThreadType.SPONSORED_DISCOVERY_THREAD && thread.sponsoredConversationWindowId) {
      return this.validateSponsoredCommercialConsistency(thread);
    }

    if (thread.negotiationId) {
      if (!thread.negotiation) return false;
      const n = thread.negotiation;
      if (n.buyerOrganizationId !== thread.buyerOrganizationId || n.sellerOrganizationId !== thread.sellerOrganizationId) {
        return false;
      }
      if (thread.productId && n.productId !== thread.productId) return false;
    }
    if (thread.productId && thread.product && thread.product.id !== thread.productId) return false;
    if (thread.product && thread.productId && thread.sellerOrganizationId !== thread.product.organizationId) {
      return false;
    }
    const rel = await this.findAcceptedRelationship(thread.buyerOrganizationId, thread.sellerOrganizationId);
    return Boolean(rel);
  }

  private validateSponsoredCommercialConsistency(thread: ThreadWithNav): boolean {
    const w = thread.sponsoredConversationWindow;
    if (!w) return false;
    const now = new Date();
    if (w.expiresAt < now) return false;
    if (
      w.state === TemporaryCommercialHandshakeState.SPONSORED_WINDOW_EXPIRED ||
      w.state === TemporaryCommercialHandshakeState.RELATIONSHIP_REJECTED
    ) {
      return false;
    }
    if (!w.temporaryConversationAllowed) return false;
    if (thread.buyerOrganizationId !== w.targetOrganizationId || thread.sellerOrganizationId !== w.sponsorOrganizationId) {
      return false;
    }
    if (thread.productId && thread.productId !== w.productId) return false;
    if (thread.negotiationId) {
      if (!thread.negotiation) return false;
      const n = thread.negotiation;
      if (n.buyerOrganizationId !== thread.buyerOrganizationId || n.sellerOrganizationId !== thread.sellerOrganizationId) {
        return false;
      }
      if (thread.productId && n.productId !== thread.productId) return false;
    }
    if (thread.productId && thread.product && thread.product.id !== thread.productId) return false;
    if (thread.product && thread.productId && thread.sellerOrganizationId !== thread.product.organizationId) {
      return false;
    }
    return true;
  }
}
