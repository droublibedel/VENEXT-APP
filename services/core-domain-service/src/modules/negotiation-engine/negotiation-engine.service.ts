import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import {
  MessageType,
  NegotiationStatus,
  PaymentMode,
  Prisma,
  RelationshipStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SponsoredNegotiationAccessService } from "../commerce-thread-access/sponsored-negotiation-access.service";
import { CommercialTrustTouchService } from "../commercial-trust/commercial-trust-touch.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationshipGovernanceService } from "../relationship-governance/relationship-governance.service";
import { detectOptionalDependencyStatus } from "../relationship-governance/relationship-governance-optional-deps";
import { RelationalCartService } from "../relational-cart/relational-cart.service";

const d = (n: string | number) => new Prisma.Decimal(n);

/**
 * Commerce negotiation state — proposals mutate authoritative negotiation row (Instruction 7 §4).
 */
@Injectable()
export class NegotiationEngineService {
  private static readonly log = new Logger(NegotiationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sponsoredNegotiation: SponsoredNegotiationAccessService,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
    @Optional() private readonly corridorPolicy?: RelationshipGovernancePolicyService,
    @Optional() private readonly corridorGovernance?: RelationshipGovernanceService,
    @Optional() private readonly relationalCart?: RelationalCartService,
  ) {}

  private async resolveRelationshipIdForNegotiation(neg: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
  }): Promise<string | null> {
    const r = await this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          {
            upstreamOrganizationId: neg.sellerOrganizationId,
            downstreamOrganizationId: neg.buyerOrganizationId,
          },
          {
            upstreamOrganizationId: neg.buyerOrganizationId,
            downstreamOrganizationId: neg.sellerOrganizationId,
          },
          {
            requesterOrganizationId: neg.buyerOrganizationId,
            receiverOrganizationId: neg.sellerOrganizationId,
          },
          {
            requesterOrganizationId: neg.sellerOrganizationId,
            receiverOrganizationId: neg.buyerOrganizationId,
          },
        ],
      },
      select: { id: true },
    });
    return r?.id ?? null;
  }

  private async touchCorridorForNegotiation(neg: { buyerOrganizationId: string; sellerOrganizationId: string }) {
    const rid = await this.resolveRelationshipIdForNegotiation(neg);
    if (rid) this.corridorGovernance?.touchRelationship(rid);
  }

  private assertGovernanceDepsForMutation(path: string): void {
    const dep = detectOptionalDependencyStatus({
      negotiationCorridorPolicyMissing: !this.corridorPolicy,
      trustProfileRowMissing: false,
      sponsoredSyncCorridorGovernanceMissing: false,
      cartConversionCorridorPolicyMissing: false,
      corridorRealtimePublisherUnconfigured: false,
      commercialTrustTouchMissing: !this.trustTouch,
    });
    const failClosed = dep.productionFailClosed;
    if (!this.corridorPolicy && failClosed) {
      throw new InternalServerErrorException({
        code: "governance_dependency_missing",
        detail: path,
        optionalDependencyMissing: dep.optionalDependencyMissing,
      });
    }
    if (!this.corridorPolicy && process.env.NODE_ENV === "production" && !failClosed) {
      NegotiationEngineService.log.error(
        JSON.stringify({
          job: "negotiation_governance",
          phase: "optional_dependency_missing",
          path,
          optionalDependencyMissing: dep.optionalDependencyMissing,
          optionalDependencyWarnings: dep.optionalDependencyWarnings,
          productionFailClosed: false,
        }),
      );
    } else if (!this.corridorPolicy && process.env.NODE_ENV !== "test") {
      NegotiationEngineService.log.warn(
        JSON.stringify({
          job: "negotiation_governance",
          phase: "optional_dependency_missing_dev",
          path,
          optionalDependencyWarnings: dep.optionalDependencyWarnings,
        }),
      );
    }
  }

  private async assertNegotiationCorridor(
    negotiationId: string,
    neg: { buyerOrganizationId: string; sellerOrganizationId: string },
  ) {
    const rid = await this.resolveRelationshipIdForNegotiation(neg);
    if (rid) {
      this.assertGovernanceDepsForMutation("negotiation_corridor");
      if (this.corridorPolicy) {
        const governanceTelemetry = { warnings: [] as string[], governanceWarningCodes: [] as string[] };
        await this.corridorPolicy.assertCorridorOperational(rid, "negotiation", { governanceTelemetry });
        if (governanceTelemetry.governanceWarningCodes.length > 0) {
          NegotiationEngineService.log.log(
            JSON.stringify({
              job: "negotiation_corridor",
              phase: "governance_operational_telemetry",
              relationshipId: rid,
              governanceOperationalWarnings: governanceTelemetry.warnings,
              governanceWarningCodes: governanceTelemetry.governanceWarningCodes,
            }),
          );
        }
      }
      return;
    }
    const ctx = await this.sponsoredNegotiation.sponsoredNegotiationContext(negotiationId);
    if (ctx.sponsoredNegotiation && !ctx.hasAcceptedRelationship) return;
    throw new BadRequestException({
      code: "commercial_corridor_required",
      message: "Corridor commercial résolu obligatoire pour cette mutation de négociation.",
    });
  }

  async getNegotiation(id: string) {
    const row = await this.prisma.negotiation.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(id);
    return row;
  }

  private async appendNegotiationMessage(
    negotiationId: string,
    input: {
      senderUserId: string;
      senderOrganizationId: string;
      messageType: MessageType;
      content?: string | null;
      structuredEvent?: Prisma.InputJsonValue;
    },
  ) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { negotiationId },
    });
    if (!thread) return null;
    return this.prisma.message.create({
      data: {
        threadId: thread.id,
        senderUserId: input.senderUserId,
        senderOrganizationId: input.senderOrganizationId,
        messageType: input.messageType,
        content: input.content ?? null,
        structuredEvent: input.structuredEvent ?? Prisma.JsonNull,
      },
    });
  }

  async proposePrice(
    negotiationId: string,
    actorUserId: string,
    actorOrganizationId: string,
    unitPrice: number,
  ) {
    const neg = await this.getNegotiation(negotiationId);
    await this.assertNegotiationCorridor(negotiationId, neg);
    if (neg.status === NegotiationStatus.CONVERTED_TO_CART || neg.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException("negotiation_closed");
    }
    const updated = await this.prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.PROPOSED,
        proposedPrice: d(unitPrice),
      },
    });
    await this.appendNegotiationMessage(negotiationId, {
      senderUserId: actorUserId,
      senderOrganizationId: actorOrganizationId,
      messageType: MessageType.PRICE_PROPOSAL,
      content: `Proposition de prix unitaire: ${unitPrice}`,
      structuredEvent: { kind: "price_proposal", proposedUnitPrice: unitPrice, currency: "XOF" },
    });
    void this.touchCorridorForNegotiation(neg);
    return updated;
  }

  async proposePaymentMode(
    negotiationId: string,
    actorUserId: string,
    actorOrganizationId: string,
    mode: PaymentMode,
    constraints?: Record<string, unknown>,
  ) {
    const neg = await this.getNegotiation(negotiationId);
    await this.assertNegotiationCorridor(negotiationId, neg);
    if (neg.status === NegotiationStatus.CONVERTED_TO_CART || neg.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException("negotiation_closed");
    }
    const product = await this.prisma.product.findUnique({ where: { id: neg.productId } });
    if (product && !product.paymentModes.includes(mode)) {
      throw new BadRequestException("payment_mode_not_allowed_on_product");
    }
    const updated = await this.prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.PROPOSED,
        proposedPaymentMode: mode,
        ...(constraints != null
          ? { paymentConstraints: constraints as Prisma.InputJsonValue }
          : {}),
      },
    });
    await this.appendNegotiationMessage(negotiationId, {
      senderUserId: actorUserId,
      senderOrganizationId: actorOrganizationId,
      messageType: MessageType.PAYMENT_PROPOSAL,
      content: `Mode de paiement proposé: ${mode}`,
      structuredEvent: {
        kind: "payment_mode_proposal",
        mode,
        constraints: (constraints ?? {}) as Prisma.InputJsonValue,
      } as Prisma.InputJsonValue,
    });
    void this.touchCorridorForNegotiation(neg);
    return updated;
  }

  async proposeQuantity(
    negotiationId: string,
    actorUserId: string,
    actorOrganizationId: string,
    quantity: number,
  ) {
    const neg = await this.getNegotiation(negotiationId);
    await this.assertNegotiationCorridor(negotiationId, neg);
    if (neg.status === NegotiationStatus.CONVERTED_TO_CART || neg.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException("negotiation_closed");
    }
    const updated = await this.prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.PROPOSED,
        proposedQuantity: d(quantity),
      },
    });
    await this.appendNegotiationMessage(negotiationId, {
      senderUserId: actorUserId,
      senderOrganizationId: actorOrganizationId,
      messageType: MessageType.QUANTITY_PROPOSAL,
      content: `Proposition de quantité: ${quantity}`,
      structuredEvent: { kind: "quantity_proposal", quantity },
    });
    void this.touchCorridorForNegotiation(neg);
    return updated;
  }

  async accept(
    negotiationId: string,
    actorUserId: string,
    actorOrganizationId: string,
    partial?: { quantity?: number; unitPrice?: number },
  ) {
    const neg = await this.getNegotiation(negotiationId);
    await this.assertNegotiationCorridor(negotiationId, neg);
    const qty = partial?.quantity != null ? d(partial.quantity) : neg.proposedQuantity;
    const price = partial?.unitPrice != null ? d(partial.unitPrice) : neg.proposedPrice;
    if (!qty || !price) throw new BadRequestException("missing_proposal_snapshot");

    const ctx = await this.sponsoredNegotiation.sponsoredNegotiationContext(negotiationId);
    if (ctx.sponsoredNegotiation && !ctx.hasAcceptedRelationship) {
      const prevMeta =
        neg.negotiationDraftMetadata && typeof neg.negotiationDraftMetadata === "object"
          ? (neg.negotiationDraftMetadata as Record<string, unknown>)
          : {};
      const updated = await this.prisma.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: NegotiationStatus.PROPOSED,
          negotiationDraftMetadata: {
            ...prevMeta,
            sponsoredPrincipleAgreement: true,
            relationshipStillRequired: true,
            hardNegotiationAcceptanceBlocked: true,
            allowedSponsoredAction: "SPONSORED_PRINCIPLE_AGREEMENT",
            sponsoredNegotiation: true,
            principleAgreementQuantity: qty.toString(),
            principleAgreementPrice: price.toString(),
            principleAgreementAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
      await this.appendNegotiationMessage(negotiationId, {
        senderUserId: actorUserId,
        senderOrganizationId: actorOrganizationId,
        messageType: MessageType.SYSTEM_EVENT,
        content:
          "Alignement de principe enregistré (découverte sponsorisée) — pas d’acceptation négociation « corridor » sans relation commerciale acceptée.",
        structuredEvent: {
          kind: "sponsored_principle_agreement",
          quantity: qty.toString(),
          unitPrice: price.toString(),
          sponsoredNegotiation: true,
          relationshipStillRequired: true,
          hardAcceptanceBlocked: true,
          allowedSponsoredAction: "SPONSORED_PRINCIPLE_AGREEMENT",
        } as Prisma.InputJsonValue,
      });
      this.trustTouch?.touchOrganizations([neg.buyerOrganizationId, neg.sellerOrganizationId]);
      void this.touchCorridorForNegotiation(neg);
      void this.relationalCart?.createCartFromSponsoredPrincipleAgreement(negotiationId);
      return updated;
    }

    const updated = await this.prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.ACCEPTED,
        acceptedQuantity: qty,
        acceptedPrice: price,
        acceptedPaymentMode: neg.proposedPaymentMode ?? undefined,
      },
    });
    await this.appendNegotiationMessage(negotiationId, {
      senderUserId: actorUserId,
      senderOrganizationId: actorOrganizationId,
      messageType: MessageType.ACCEPTANCE_EVENT,
      content: "Proposition acceptée — alignement commercial confirmé.",
      structuredEvent: {
        kind: "acceptance",
        quantity: qty.toString(),
        unitPrice: price.toString(),
      },
    });
    this.trustTouch?.touchOrganizations([updated.buyerOrganizationId, updated.sellerOrganizationId]);
    void this.touchCorridorForNegotiation(updated);
    void this.relationalCart?.createCartFromNegotiation(negotiationId, actorUserId, actorOrganizationId, {
      markNegotiationConverted: false,
    });
    return updated;
  }

  async reject(negotiationId: string, actorUserId: string, actorOrganizationId: string, reason?: string) {
    const neg = await this.getNegotiation(negotiationId);
    await this.assertNegotiationCorridor(negotiationId, neg);
    const updated = await this.prisma.negotiation.update({
      where: { id: negotiationId },
      data: { status: NegotiationStatus.REJECTED },
    });
    await this.appendNegotiationMessage(negotiationId, {
      senderUserId: actorUserId,
      senderOrganizationId: actorOrganizationId,
      messageType: MessageType.REJECTION_EVENT,
      content: reason ?? "Proposition refusée — négociation close côté opérateur.",
      structuredEvent: { kind: "rejection", reason: reason ?? "" },
    });
    this.trustTouch?.touchOrganizations([updated.buyerOrganizationId, updated.sellerOrganizationId]);
    void this.touchCorridorForNegotiation(updated);
    return updated;
  }

  async reservationIntent(
    negotiationId: string,
    actorUserId: string,
    actorOrganizationId: string,
    note?: string,
  ) {
    const neg = await this.getNegotiation(negotiationId);
    await this.assertNegotiationCorridor(negotiationId, neg);
    const rid = await this.resolveRelationshipIdForNegotiation(neg);
    if (rid) {
      this.assertGovernanceDepsForMutation("reservation_intent");
      if (this.corridorPolicy) {
        await this.corridorPolicy.assertCorridorOperational(rid, "reservation_strong");
      }
    }
    await this.appendNegotiationMessage(negotiationId, {
      senderUserId: actorUserId,
      senderOrganizationId: actorOrganizationId,
      messageType: MessageType.SYSTEM_EVENT,
      content: note ?? "Intention de réservation stock — attente confirmation vendeur.",
      structuredEvent: { kind: "reservation_intent" },
    });
    return this.prisma.negotiation.findUnique({ where: { id: negotiationId } });
  }
}
