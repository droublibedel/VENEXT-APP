import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma, RelationshipStatus, ThreadType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type SponsoredNegotiationDiagnostics = {
  sponsoredNegotiation: boolean;
  relationshipStillRequired: boolean;
  hardAcceptanceBlocked: boolean;
  hasAcceptedRelationship: boolean;
  allowedSponsoredAction?: "SPONSORED_PRINCIPLE_AGREEMENT" | "SPONSORED_INTEREST_CONFIRMED" | "SPONSORED_RELATIONSHIP_REQUEST_READY";
  threadId?: string;
  windowId?: string;
};

/**
 * Instruction 20.2A — detect sponsored discovery negotiations and enforce corridor vs ACCEPTED relationship.
 */
@Injectable()
export class SponsoredNegotiationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private orgPairOr(a: string, b: string): Prisma.RelationshipWhereInput[] {
    return [
      { AND: [{ requesterOrganizationId: a }, { receiverOrganizationId: b }] },
      { AND: [{ requesterOrganizationId: b }, { receiverOrganizationId: a }] },
      { AND: [{ upstreamOrganizationId: a }, { downstreamOrganizationId: b }] },
      { AND: [{ upstreamOrganizationId: b }, { downstreamOrganizationId: a }] },
    ];
  }

  async findAcceptedRelationship(buyerOrganizationId: string, sellerOrganizationId: string) {
    return this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: this.orgPairOr(buyerOrganizationId, sellerOrganizationId),
      },
      select: { id: true },
    });
  }

  async sponsoredNegotiationContext(negotiationId: string): Promise<SponsoredNegotiationDiagnostics> {
    const thread = await this.prisma.messageThread.findFirst({
      where: {
        negotiationId,
        threadType: ThreadType.SPONSORED_DISCOVERY_THREAD,
        sponsoredConversationWindowId: { not: null },
      },
      select: {
        id: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        sponsoredConversationWindowId: true,
      },
    });
    if (
      !thread ||
      !thread.buyerOrganizationId ||
      !thread.sellerOrganizationId ||
      !thread.sponsoredConversationWindowId
    ) {
      return {
        sponsoredNegotiation: false,
        relationshipStillRequired: false,
        hardAcceptanceBlocked: false,
        hasAcceptedRelationship: false,
      };
    }
    const rel = await this.findAcceptedRelationship(thread.buyerOrganizationId, thread.sellerOrganizationId);
    const has = Boolean(rel);
    return {
      sponsoredNegotiation: true,
      relationshipStillRequired: !has,
      hardAcceptanceBlocked: !has,
      hasAcceptedRelationship: has,
      threadId: thread.id,
      windowId: thread.sponsoredConversationWindowId,
    };
  }

  /** Block convert-to-cart / relational order materialization without ACCEPTED corridor. */
  async assertConvertToCartAllowed(negotiationId: string): Promise<void> {
    const ctx = await this.sponsoredNegotiationContext(negotiationId);
    if (ctx.sponsoredNegotiation && !ctx.hasAcceptedRelationship) {
      throw new BadRequestException({
        code: "sponsored_convert_to_cart_blocked",
        detail: "Instruction 20.2A — conversion panier / commande relationnelle interdite sans Relationship ACCEPTED.",
        diagnostics: ctx,
      });
    }
  }

  /** Hard NegotiationStatus.ACCEPTED is forbidden for sponsored corridor until relationship ACCEPTED. */
  async assertHardNegotiationAcceptAllowed(negotiationId: string): Promise<SponsoredNegotiationDiagnostics> {
    const ctx = await this.sponsoredNegotiationContext(negotiationId);
    if (ctx.sponsoredNegotiation && !ctx.hasAcceptedRelationship) {
      throw new ForbiddenException({
        code: "sponsored_hard_negotiation_accept_blocked",
        detail:
          "Instruction 20.2A — acceptation métier forte bloquée sur négociation sponsorisée sans corridor ACCEPTED.",
        diagnostics: {
          ...ctx,
          allowedSponsoredAction: "SPONSORED_PRINCIPLE_AGREEMENT",
        },
      });
    }
    return ctx;
  }
}
