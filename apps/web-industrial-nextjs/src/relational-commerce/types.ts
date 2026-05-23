import type { LivingCatalogCard } from "@/product-intelligence/types";

export type PartnerSegment = {
  supplierOrganizationId: string;
  supplier: LivingCatalogCard["supplier"] | null;
  catalogIsolation: string;
  cards: LivingCatalogCard[];
};

export type SegmentedPartnerFeedResponse = {
  relationshipId: string;
  relationshipStatus: string;
  commercePrinciples: {
    closedNetwork: boolean;
    noPublicPriceComparison: boolean;
    noSupplierRankingByPrice: boolean;
    supplierIdentityAlwaysVisible: boolean;
  };
  partnerSegments: PartnerSegment[];
  sponsoredInRelationship: (LivingCatalogCard & { disclosure?: string })[];
  sponsoredDiscoveryOutsideEdge: unknown[];
};
