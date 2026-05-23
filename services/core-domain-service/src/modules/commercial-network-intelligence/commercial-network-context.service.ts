import { Injectable } from "@nestjs/common";
import { OrderStatus, OrganizationCategory, OrgMemberStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationalCommerceNetworkTraverserService } from "../relational-commerce/relational-commerce-network-traverser.service";
import { RelationshipSuggestionEngineService } from "../relational-commerce/relationship-suggestion-engine.service";

export type OrderEdge = { buyerOrganizationId: string; sellerOrganizationId: string; createdAt: Date };

export type CommercialNetworkContext = {
  organizationId: string;
  generatedAt: string;
  partnersPack: Awaited<ReturnType<RelationalCommerceNetworkTraverserService["partners"]>>;
  relationships: Awaited<ReturnType<CommercialNetworkContextService["loadRelationships"]>>;
  orders30d: OrderEdge[];
  ordersPrev30d: OrderEdge[];
  negotiations30d: number;
  messageThreads30d: number;
  suggestionSample?: { mutualContactClusters: number; graphSuggestions: number };
};

/**
 * Instruction 12A — short TTL cache per org to reduce duplicate Prisma + graph work when
 * clients hit granular refresh endpoints in a burst. Prefer `/bundle` for cold loads.
 */
@Injectable()
export class CommercialNetworkContextService {
  private readonly ctxCache = new Map<string, { builtAt: number; ctx: CommercialNetworkContext }>();
  private readonly ctxCacheTtlMs = 1500;

  constructor(
    private readonly prisma: PrismaService,
    private readonly networkTraverser: RelationalCommerceNetworkTraverserService,
    private readonly suggestions: RelationshipSuggestionEngineService,
  ) {}

  private async loadRelationships(organizationId: string) {
    return this.prisma.relationship.findMany({
      where: {
        OR: [
          { requesterOrganizationId: organizationId },
          { receiverOrganizationId: organizationId },
          { upstreamOrganizationId: organizationId },
          { downstreamOrganizationId: organizationId },
        ],
      },
      select: {
        id: true,
        status: true,
        source: true,
        trustLevel: true,
        createdAt: true,
        acceptedAt: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
      },
      take: 800,
      orderBy: { createdAt: "desc" },
    });
  }

  async build(organizationId: string): Promise<CommercialNetworkContext> {
    const now = Date.now();
    const hit = this.ctxCache.get(organizationId);
    if (hit && now - hit.builtAt < this.ctxCacheTtlMs) {
      return hit.ctx;
    }
    const ctx = await this.buildFresh(organizationId);
    this.ctxCache.set(organizationId, { builtAt: now, ctx });
    return ctx;
  }

  private async buildFresh(organizationId: string): Promise<CommercialNetworkContext> {
    const now = Date.now();
    const t30 = new Date(now - 30 * 86400000);
    const t60 = new Date(now - 60 * 86400000);

    const [partnersPack, relationships, ordersRecent, ordersPrev, negCount, threadCount, member] = await Promise.all([
      this.networkTraverser.partners(organizationId),
      this.loadRelationships(organizationId),
      this.prisma.order.findMany({
        where: {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
          status: { notIn: [OrderStatus.CANCELLED] },
          createdAt: { gte: t30 },
        },
        select: { buyerOrganizationId: true, sellerOrganizationId: true, createdAt: true },
        take: 2500,
      }),
      this.prisma.order.findMany({
        where: {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
          status: { notIn: [OrderStatus.CANCELLED] },
          createdAt: { gte: t60, lt: t30 },
        },
        select: { buyerOrganizationId: true, sellerOrganizationId: true, createdAt: true },
        take: 2500,
      }),
      this.prisma.negotiation.count({
        where: {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
          createdAt: { gte: t30 },
        },
      }),
      this.prisma.messageThread.count({
        where: {
          OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
          createdAt: { gte: t30 },
        },
      }),
      this.prisma.organizationMember.findFirst({
        where: { organizationId, status: OrgMemberStatus.ACTIVE },
        select: { userId: true },
      }),
    ]);

    let suggestionSample: CommercialNetworkContext["suggestionSample"];
    if (member?.userId) {
      const sug = await this.suggestions.suggestionsForUser(member.userId);
      suggestionSample = {
        mutualContactClusters: sug.mutualContactClusters.length,
        graphSuggestions: sug.graphSuggestions.length,
      };
    }

    return {
      organizationId,
      generatedAt: new Date().toISOString(),
      partnersPack,
      relationships,
      orders30d: ordersRecent,
      ordersPrev30d: ordersPrev,
      negotiations30d: negCount,
      messageThreads30d: threadCount,
      suggestionSample,
    };
  }
}

export function isWholesalerCategory(c: OrganizationCategory) {
  return c === OrganizationCategory.WHOLESALER_A || c === OrganizationCategory.WHOLESALER_B;
}

export function isRetailerCategory(c: OrganizationCategory) {
  return c === OrganizationCategory.RETAILER;
}
