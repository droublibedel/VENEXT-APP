import { Injectable } from "@nestjs/common";
import { ProductVisibilityType } from "@prisma/client";
import { ProductIntelligenceService } from "../product-intelligence/product-intelligence.service";
import { CatalogVisibilityEngineService } from "../catalog-visibility/catalog-visibility-engine.service";
import { RelationalFlagsService } from "./relational-flags.service";
import { SponsoredInjectionEngineService } from "./sponsored-injection-engine.service";

/**
 * Relational marketplace — supplier-segmented lanes, sponsored separated (Instruction 9 §12).
 * **Business rule:** no public price comparison or supplier ranking by price.
 */
@Injectable()
export class RelationalCatalogEngineService {
  constructor(
    private readonly intelligence: ProductIntelligenceService,
    private readonly visibility: CatalogVisibilityEngineService,
    private readonly sponsored: SponsoredInjectionEngineService,
    private readonly flags: RelationalFlagsService,
  ) {}

  async segmentedPartnerFeed(input: {
    relationshipId: string;
    viewerOrganizationId?: string;
    /** When set, only that supplier's cards (explicit context switch). */
    supplierOrganizationId?: string;
    viewerCategory?: string;
    limitPartners?: number;
    catalogLimit?: number;
    catalogCursor?: string;
    catalogProjection?: "summary" | "standard" | "full";
    sponsoredLimit?: number;
    sponsoredCursor?: string;
    sponsoredProjection?: "summary" | "standard" | "full";
  }) {
    await this.visibility.assertRelationshipAcceptedForCatalog(input.relationshipId, input.viewerOrganizationId);
    const flat = await this.intelligence.livingCatalog(input.relationshipId, input.viewerOrganizationId, {
      limit: input.catalogLimit,
      cursor: input.catalogCursor,
      projection: input.catalogProjection,
    });

    type CatalogCardRow = {
      visibilityType: ProductVisibilityType;
      supplier: { id: string };
      [key: string]: unknown;
    };
    const catalogCards = flat.cards as CatalogCardRow[];

    const sponsoredCards = catalogCards.filter((c) => c.visibilityType === ProductVisibilityType.SPONSORED_INJECTION);
    const partnerCards = catalogCards.filter((c) => c.visibilityType !== ProductVisibilityType.SPONSORED_INJECTION);

    const filtered = input.supplierOrganizationId
      ? partnerCards.filter((c) => c.supplier.id === input.supplierOrganizationId)
      : partnerCards;

    const bySupplier = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const sid = c.supplier.id;
      if (!bySupplier.has(sid)) bySupplier.set(sid, []);
      bySupplier.get(sid)!.push(c);
    }

    const segments = [...bySupplier.entries()].map(([supplierOrganizationId, cards]) => ({
      supplierOrganizationId,
      supplier: cards[0]?.supplier,
      catalogIsolation: "RELATIONSHIP_BOUND",
      cards,
    }));

    if (input.limitPartners && segments.length > input.limitPartners) {
      segments.length = input.limitPartners;
    }

    const sponsoredLane = sponsoredCards.map((c) => ({
      ...c,
      disclosure: "SPONSORED_IN_RELATIONSHIP_CONTEXT",
    }));

    const sponsoredDiscovery = await this.sponsored.listActiveInjections({
      viewerCategory: input.viewerCategory,
      viewerOrganizationId: input.viewerOrganizationId,
      limit: input.sponsoredLimit,
      cursor: input.sponsoredCursor,
      projection: input.sponsoredProjection,
    });
    const sponsoredOn = await this.flags.isEnabled("sponsored_products_enabled", input.viewerOrganizationId);

    return {
      relationshipId: input.relationshipId,
      relationshipStatus: flat.relationshipStatus,
      catalogPage: flat.page,
      commercePrinciples: {
        closedNetwork: true,
        noPublicPriceComparison: true,
        noSupplierRankingByPrice: true,
        supplierIdentityAlwaysVisible: true,
      },
      partnerSegments: segments,
      sponsoredInRelationship: sponsoredOn ? sponsoredLane : [],
      sponsoredDiscoveryOutsideEdge: sponsoredOn ? sponsoredDiscovery.items : [],
      sponsoredDiscoveryPage: sponsoredOn
        ? sponsoredDiscovery.page
        : {
            limit: input.sponsoredLimit ?? 0,
            nextCursor: null,
            hasMore: false,
            projection: input.sponsoredProjection ?? "standard",
          },
    };
  }
}
