/**
 * Instruction 20.2 — sponsored commercial discovery concepts (TypeScript layer).
 * These are not Prisma enums; DB enums live in `schema.prisma`.
 */

export type SponsoredConversationScope = {
  kind: "SPONSORED_TEMPORARY_CORRIDOR";
  campaignId: string;
  windowId: string;
  sponsorOrganizationId: string;
  targetOrganizationId: string;
  productId: string;
  expiresAtIso: string;
  /** Never implies Relationship ACCEPTED or full network access. */
  notRelationshipAccepted: true;
};

export type SponsoredDiscoveryVisibility = {
  /** Only the sponsored SKU surface — not full catalog. */
  visibleProductIds: string[];
  publicMetadataKeys: readonly string[];
  showSponsoredBadges: true;
  showRegionalContext: true;
  minimalCommercialIdentity: true;
  hidePartnerNetwork: true;
  hidePrivateMetrics: true;
  hideInternalCorridors: true;
  hideOtherThreads: true;
  hideNonSponsoredProducts: true;
};

export const DEFAULT_SPONSORED_VISIBILITY: SponsoredDiscoveryVisibility = {
  visibleProductIds: [],
  publicMetadataKeys: ["name", "category", "unitLabel", "currency", "qualityBadges", "commercialBadges"],
  showSponsoredBadges: true,
  showRegionalContext: true,
  minimalCommercialIdentity: true,
  hidePartnerNetwork: true,
  hidePrivateMetrics: true,
  hideInternalCorridors: true,
  hideOtherThreads: true,
  hideNonSponsoredProducts: true,
};

export type SponsoredThreadDiagnostics = {
  sponsoredConversation: true;
  relationshipAccepted: false;
  temporaryCommercialScope: true;
  sponsoredWindowExpiresAt: string;
  commercialAccessLevel: "SPONSORED_DISCOVERY_ONLY";
  catalogVisibilityRestricted: true;
  relationshipRequiredForOrders: true;
  sponsorOrganizationId: string;
  sponsoredProductId: string;
  campaignId: string;
  handshakeState: string;
  discoverySource: string;
};
