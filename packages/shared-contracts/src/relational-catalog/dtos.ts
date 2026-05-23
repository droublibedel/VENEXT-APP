import { z } from "zod";

/**
 * Instruction 19.2 — relational catalog layer reuses the official commercial relationship graph
 * materializer (19.1A); this token is echoed in diagnostics for traceability (no second relational truth).
 */
export const RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN =
  "CRG_19.1:CommercialRelationshipGraphEngineService(bundle_projection_embedded)" as const;

const unit = z.number().min(0).max(1);

export const RelationalCatalogViewerRoleSchema = z.enum([
  "INDUSTRIAL_PRODUCER",
  "PRODUCER",
  "WHOLESALER",
  "RETAILER",
  "ADMIN_VIEWER",
  "UNKNOWN_COMMERCIAL_VIEWER",
]);
export type RelationalCatalogViewerRole = z.infer<typeof RelationalCatalogViewerRoleSchema>;

export const RelationalCatalogProductSignalTypeSchema = z.enum([
  "dormant_product_signal",
  /** Instruction 19.2B — densité de références paginées, pas d’intérêt comportemental mesuré. */
  "relational_catalog_density_signal",
  "relationship_expansion_signal",
  "supply_pressure_signal",
  "visibility_injection_signal",
  "isolated_catalog_signal",
  "distribution_gap_signal",
]);
export type RelationalCatalogProductSignalType = z.infer<typeof RelationalCatalogProductSignalTypeSchema>;

export const RelationalCatalogProductSignalSchema = z.object({
  signalId: z.string().max(64),
  signalType: RelationalCatalogProductSignalTypeSchema,
  productId: z.string().uuid().optional(),
  catalogId: z.string().uuid().optional(),
  severity: z.enum(["info", "low", "medium", "high"]),
  confidence: unit,
  confidenceExplanation: z.string().max(480),
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  explanation: z.string().max(720),
  sourceSignals: z.array(z.string()).max(24),
});
export type RelationalCatalogProductSignal = z.infer<typeof RelationalCatalogProductSignalSchema>;

export const RelationalAccessibleProductSchema = z.object({
  productId: z.string().uuid(),
  catalogId: z.string().uuid(),
  /** Prisma `Product.unitLabel` — required for POST relational-cart/from-catalog `unit`. */
  unitLabel: z.string().max(120),
  sourceOrganizationId: z.string().uuid(),
  sourceOrganizationName: z.string().max(200),
  visibilityScope: z.string().max(120),
  relationshipOrigin: z.string().max(200),
  relationshipDistance: z.number().int().min(0).max(6),
  commercialAvailability: z.enum(["SYMBOLIC_STOCK_STATUS", "UNKNOWN"]),
  commercialSignals: z.array(z.string()).max(16),
  sponsored: z.boolean(),
  confidence: unit,
  explanation: z.string().max(720),
  /** When set, buyer can POST relational-cart/from-catalog for this corridor + product. */
  cartEligibleRelationshipId: z.string().uuid().nullable().optional(),
});
export type RelationalAccessibleProduct = z.infer<typeof RelationalAccessibleProductSchema>;

export const RelationalAccessibleCatalogSchema = z.object({
  catalogId: z.string().uuid(),
  ownerOrganizationId: z.string().uuid(),
  ownerOrganizationName: z.string().max(200),
  name: z.string().max(200),
  catalogType: z.string().max(40),
  visibilityMode: z.string().max(40),
  relationshipScoped: z.literal(true),
  accessibleProductCount: z.number().int().min(0),
  explanation: z.string().max(480),
});
export type RelationalAccessibleCatalog = z.infer<typeof RelationalAccessibleCatalogSchema>;

export const RelationalVisibilityScopeRowSchema = z.object({
  scopeId: z.string().max(64),
  visibilitySource: z.enum(["RELATIONSHIP", "ORGANIZATION", "TERRITORY_LABEL", "TEMPORARY_EXPIRING", "SPONSORED_INJECTION"]),
  visibilityReason: z.string().max(320),
  injectedVisibility: z.boolean(),
  sponsorOrigin: z.string().uuid().nullable(),
  relationshipId: z.string().uuid().nullable(),
  relationshipDistance: z.number().int().min(0).max(6),
  territoryLabel: z.string().max(160).nullable(),
  actorCategory: z.string().max(40).nullable(),
});
export type RelationalVisibilityScopeRow = z.infer<typeof RelationalVisibilityScopeRowSchema>;

export const RelationalSponsoredInsertionRowSchema = z.object({
  injectionId: z.string().uuid(),
  productId: z.string().uuid(),
  sponsorOrganizationId: z.string().uuid(),
  relationshipId: z.string().uuid().nullable(),
  relevanceFloor: z.number(),
  maxRelationshipDepth: z.number().int(),
  active: z.boolean(),
  explanation: z.string().max(480),
});
export type RelationalSponsoredInsertionRow = z.infer<typeof RelationalSponsoredInsertionRowSchema>;

export const RelationalCatalogIntelligenceSchema = z.object({
  relationshipCoverage: unit,
  catalogDensity: unit,
  dependencyPressure: unit,
  isolatedRetailersProxy: z.number().int().min(0),
  concentratedWholesalersProxy: z.number().int().min(0),
  sponsorSaturation: unit,
  visibilityImbalance: unit,
  /** Instruction 19.2B — champs *Proxy ne sont pas des comptages terrain vérifiés. */
  proxyDerived: z.literal(true),
  /** Entrées heuristiques documentées (symboles, pas vérité opérationnelle). */
  proxyInputs: z.array(z.string().max(200)).max(28),
  intelligenceExplanation: z.string().max(1400),
});
export type RelationalCatalogIntelligence = z.infer<typeof RelationalCatalogIntelligenceSchema>;

export const RelationalCatalogPartnerSourceSchema = z.enum(["GRAPH_BUNDLE", "PRISMA_FALLBACK"]);
export type RelationalCatalogPartnerSource = z.infer<typeof RelationalCatalogPartnerSourceSchema>;

export const RelationalCatalogRoleScopeModeSchema = z.enum([
  "PRODUCER_DOWNSTREAM_ONLY",
  "WHOLESALER_UPSTREAM_ONLY",
  "RETAILER_SUPPLIER_ONLY",
  "ADMIN_NEIGHBOR_ONLY",
  "UNKNOWN_SELF_ONLY",
]);
export type RelationalCatalogRoleScopeMode = z.infer<typeof RelationalCatalogRoleScopeModeSchema>;

export const RelationalCatalogDiagnosticsSchema = z.object({
  relationshipScopedCatalogs: z.literal(true),
  validatedRelationshipOnly: z.literal(true),
  publicMarketplaceDisabled: z.literal(true),
  publicDiscoveryDisabled: z.literal(true),
  socialCommerceDisabled: z.literal(true),
  graphReuse: z.string().max(360),
  sourceBundlesEmbedded: z.boolean(),
  payloadWeightClass: z.enum(["compact", "large"]),
  degradedMode: z.boolean(),
  snapshotSource: z.string().max(160),
  paginationSupported: z.boolean(),
  productsLimit: z.number().int().min(0),
  catalogsLimit: z.number().int().min(0),
  productsTruncated: z.boolean(),
  catalogsTruncated: z.boolean(),
  visibilityScopedLoading: z.literal(true),
  /** Keyset token — typically `catalogId:productId` (Instruction 19.2A), not always a bare UUID. */
  nextProductCursor: z.string().max(100).nullable(),
  /** Keyset token — typically `ownerOrganizationId:catalogId` (Instruction 19.2A). */
  nextCatalogCursor: z.string().max(100).nullable(),
  /** Instruction 19.2B — origine du corridor partenaires. */
  partnerSource: RelationalCatalogPartnerSourceSchema,
  /** True lorsque le bundle graphe 19.1A est inactif et repli Prisma borné. */
  fallbackUsed: z.boolean(),
  /** Voisins distincts sur arêtes incidentes (avant filtre rôle). */
  graphPartnerCount: z.number().int().min(0),
  /** Lecture admin large réseau : non supportée sur cette route. */
  adminBroadReadSupported: z.literal(false),
  roleScopedAccess: z.literal(true),
  roleScopeMode: RelationalCatalogRoleScopeModeSchema,
  cursorStrategy: z.literal("COMPOSITE_KEYSET"),
  signalHeuristicOnly: z.literal(true),
  visibilityPolicy: z.literal("RELATIONSHIP_SCOPED_ONLY"),
  catalogExposureMode: z.literal("PARTNER_NETWORK_ONLY"),
  sponsorGlobalInjectionBlocked: z.literal(true),
  sponsorRequiresRelationshipScope: z.literal(true),
});
export type RelationalCatalogDiagnostics = z.infer<typeof RelationalCatalogDiagnosticsSchema>;

export const RelationalCatalogSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  viewerRole: RelationalCatalogViewerRoleSchema,
  accessibleCatalogs: z.array(RelationalAccessibleCatalogSchema).max(64),
  accessibleProducts: z.array(RelationalAccessibleProductSchema).max(160),
  visibilityScopes: z.array(RelationalVisibilityScopeRowSchema).max(64),
  sponsoredInsertions: z.array(RelationalSponsoredInsertionRowSchema).max(48),
  relationalRestrictions: z.array(z.string().max(120)).max(24),
  productSignals: z.array(RelationalCatalogProductSignalSchema).max(32),
  catalogIntelligence: RelationalCatalogIntelligenceSchema,
  catalogDiagnostics: RelationalCatalogDiagnosticsSchema,
});
export type RelationalCatalogSnapshot = z.infer<typeof RelationalCatalogSnapshotSchema>;

export const RelationalCatalogResponseSchema = z.object({
  policy: z.enum(["ACTIVE", "DISABLED"]),
  snapshot: RelationalCatalogSnapshotSchema,
});
export type RelationalCatalogResponse = z.infer<typeof RelationalCatalogResponseSchema>;
