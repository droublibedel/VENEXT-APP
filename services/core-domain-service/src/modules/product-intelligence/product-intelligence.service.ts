import { Injectable, NotFoundException } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CatalogVisibilityEngineService } from "../catalog-visibility/catalog-visibility-engine.service";
import { ProductDiscussionSignalsService } from "./product-discussion-signals.service";
import { ProductMarketEnergyEngineService } from "./product-market-energy-engine.service";
import { ProductRelevanceResolverService } from "./product-relevance-resolver.service";

const productCardSelect = {
  id: true,
  organizationId: true,
  catalogId: true,
  name: true,
  description: true,
  category: true,
  imageUrls: true,
  unitLabel: true,
  basePrice: true,
  currency: true,
  stockStatus: true,
  stockQuantity: true,
  paymentModes: true,
  qualityBadges: true,
  sponsorEligible: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  economicState: true,
  traceability: true,
  organization: {
    select: {
      id: true,
      displayName: true,
      verificationStatus: true,
      commercialId: true,
    },
  },
} as const;

export type LivingCatalogQueryOpts = {
  limit?: number;
  cursor?: string;
  /** `summary` = mobile-safe light payload; `standard` default web; `full` = all enrichments */
  projection?: "summary" | "standard" | "full";
};

/**
 * Relationship-scoped living catalog — economic entities, not static SKUs (Instruction 6).
 */
@Injectable()
export class ProductIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discussion: ProductDiscussionSignalsService,
    private readonly marketEnergy: ProductMarketEnergyEngineService,
    private readonly relevance: ProductRelevanceResolverService,
    private readonly catalogGate: CatalogVisibilityEngineService,
  ) {}

  async livingCatalog(
    relationshipId: string,
    viewerOrganizationId?: string,
    opts?: LivingCatalogQueryOpts,
  ) {
    await this.catalogGate.assertRelationshipAcceptedForCatalog(relationshipId, viewerOrganizationId);

    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        id: true,
        status: true,
        downstreamOrganizationId: true,
        upstreamOrganizationId: true,
      },
    });
    if (!rel) throw new NotFoundException(`relationship:${relationshipId}`);

    const takeN = Math.min(Math.max(opts?.limit ?? 60, 1), 100);
    const projection = opts?.projection ?? "standard";
    const cursorId = opts?.cursor?.trim();

    const vis = await this.prisma.productVisibility.findMany({
      where: {
        active: true,
        visibleToRelationshipId: relationshipId,
        ...(cursorId ? { id: { gt: cursorId } } : {}),
      },
      include: {
        product: { select: productCardSelect },
      },
      orderBy: { id: "asc" },
      take: takeN + 1,
    });

    const hasMore = vis.length > takeN;
    const pageRows = hasMore ? vis.slice(0, takeN) : vis;
    const nextCursor = hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1]!.id : null;

    const buyerOrgId =
      viewerOrganizationId ??
      rel.downstreamOrganizationId ??
      rel.upstreamOrganizationId ??
      undefined;

    const cards: Record<string, unknown>[] = [];
    for (const row of pageRows) {
      const p = row.product;
      const isSummary = projection === "summary";
      const discussion = isSummary
        ? {
            narrativeLines: [] as string[],
            activeNegotiations: 0,
            productAnchoredThreads: 0,
            recentOrderLineItems: 0,
          }
        : await this.discussion.getSignals(p.id);
      const energy = isSummary
        ? { pulses: [] as { label: string; intensity: number; horizon: string }[], demandHeat: 0, tensionIndicator: 0 }
        : await this.marketEnergy.compute(p.id, p.economicState);
      const relevance =
        buyerOrgId != null && !isSummary
          ? await this.relevance.resolve({
              productId: p.id,
              retailerOrganizationId: buyerOrgId,
              relationshipId,
              zoneCode: "SN-DKR-01",
            })
          : null;

      const productPayload =
        projection === "summary"
          ? {
              id: p.id,
              name: p.name,
              category: p.category,
            }
          : projection === "full"
            ? {
                id: p.id,
                name: p.name,
                description: p.description,
                category: p.category,
                imageUrls: p.imageUrls,
                unitLabel: p.unitLabel,
                basePrice: p.basePrice,
                currency: p.currency,
                stockStatus: p.stockStatus,
                stockQuantity: p.stockQuantity,
                paymentModes: p.paymentModes,
                qualityBadges: p.qualityBadges,
                sponsorEligible: p.sponsorEligible,
                active: p.active,
              }
            : {
                id: p.id,
                name: p.name,
                description: p.description,
                category: p.category,
                imageUrls: p.imageUrls,
                unitLabel: p.unitLabel,
                basePrice: p.basePrice,
                currency: p.currency,
                stockStatus: p.stockStatus,
                stockQuantity: p.stockQuantity,
                paymentModes: p.paymentModes,
                qualityBadges: p.qualityBadges,
                sponsorEligible: p.sponsorEligible,
                active: p.active,
              };

      const supplierPayload =
        projection === "summary"
          ? {
              id: p.organization.id,
              displayName: p.organization.displayName,
              commercialId: p.organization.commercialId,
            }
          : p.organization;

      cards.push({
        visibilityId: row.id,
        visibilityType: row.visibilityType,
        product: productPayload,
        supplier: supplierPayload,
        economicState: isSummary ? null : p.economicState,
        traceability: isSummary ? null : p.traceability,
        discussion,
        marketEnergy: energy,
        relevance,
      });
    }

    return {
      relationshipId,
      relationshipStatus: rel.status,
      /** Presentation only — DB canonical is `relationshipStatus` (ACCEPTED = live edge). */
      relationshipStatusUi: rel.status === RelationshipStatus.ACCEPTED ? "active" : String(rel.status).toLowerCase(),
      cards,
      page: {
        limit: takeN,
        nextCursor,
        hasMore,
        projection,
      },
    };
  }

  async livingCard(productId: string, relationshipId: string, viewerOrganizationId?: string) {
    await this.catalogGate.assertRelationshipAcceptedForCatalog(relationshipId, viewerOrganizationId);

    const row = await this.prisma.productVisibility.findFirst({
      where: {
        productId,
        visibleToRelationshipId: relationshipId,
        active: true,
      },
      include: {
        product: { select: productCardSelect },
      },
    });
    if (!row) throw new NotFoundException(`visibility:${productId}:${relationshipId}`);
    const p = row.product;
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { downstreamOrganizationId: true, upstreamOrganizationId: true },
    });
    const buyerOrgId =
      viewerOrganizationId ??
      rel?.downstreamOrganizationId ??
      rel?.upstreamOrganizationId ??
      undefined;

    const discussion = await this.discussion.getSignals(p.id);
    const energy = await this.marketEnergy.compute(p.id, p.economicState);
    const relevance =
      buyerOrgId != null
        ? await this.relevance.resolve({
            productId: p.id,
            retailerOrganizationId: buyerOrgId,
            relationshipId,
          })
        : null;

    return {
      visibilityId: row.id,
      visibilityType: row.visibilityType,
      product: {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        imageUrls: p.imageUrls,
        unitLabel: p.unitLabel,
        basePrice: p.basePrice,
        currency: p.currency,
        stockStatus: p.stockStatus,
        stockQuantity: p.stockQuantity,
        paymentModes: p.paymentModes,
        qualityBadges: p.qualityBadges,
        sponsorEligible: p.sponsorEligible,
        active: p.active,
      },
      supplier: p.organization,
      economicState: p.economicState,
      traceability: p.traceability,
      discussion,
      marketEnergy: energy,
      relevance,
    };
  }
}
