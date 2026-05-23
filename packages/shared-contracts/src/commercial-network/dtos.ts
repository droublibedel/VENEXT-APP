import { z } from "zod";

/**
 * Instruction 19.1A — commercial-network “relationships” slice reuses the **legacy HTTP traverser**
 * (`RelationalCommerceNetworkTraverserService`: partners pack, bounded `traverseNetwork`, QR joins).
 * The **official** materialized graph bundle is `CommercialRelationshipGraphEngineService` under
 * `modules/commercial-relationship-graph/` (not invoked by this DTO path).
 */
export const COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN =
  "CRG_19.1:RelationalCommerceNetworkTraverserService(partnersPack,traverse)+CommercialRelationshipGraphEngineService(bundle_official)" as const;

export const CommercialNetworkOverviewResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  activeWholesalers: z.number(),
  unstableWholesalers: z.number(),
  retailerGrowthVelocity: z.number(),
  inactiveRegions: z.array(z.string()),
  networkExpansionVelocity: z.number(),
  relationshipAcceptanceRate: z.number(),
  commercialConfidence: z.number(),
  sponsorshipInfluenceDensity: z.number(),
  negotiationActivityLevel: z.number(),
  signalStrips: z.array(
    z.object({
      id: z.string(),
      band: z.string(),
      intensity: z.number(),
      label: z.string(),
    }),
  ),
});
export type CommercialNetworkOverviewResponse = z.infer<typeof CommercialNetworkOverviewResponseSchema>;

export const CommercialRelationshipsResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  acceptedCount: z.number(),
  pendingInvitations: z.number(),
  unstableRelationships: z.number(),
  suspendedRelationships: z.number(),
  qrRelationshipGrowth30d: z.number(),
  contactSyncRelationshipGrowth30d: z.number(),
  trustEvolution: z.object({ trend: z.enum(["rising", "flat", "declining"]), delta: z.number() }),
  commercialDependencyScore: z.number(),
  relationshipStrengthIndex: z.number(),
  graphReuse: z.literal(COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN),
  suggestionEngineSample: z
    .object({
      mutualContactClusters: z.number(),
      graphSuggestions: z.number(),
    })
    .optional(),
});
export type CommercialRelationshipsResponse = z.infer<typeof CommercialRelationshipsResponseSchema>;

export const DistributorObservatoryRowSchema = z.object({
  organizationId: z.string().uuid(),
  displayName: z.string(),
  category: z.string(),
  band: z.enum(["strongest", "unstable", "low_activity", "high_growth", "weak_conversion", "inactive"]),
  orderFlow30d: z.number(),
  priorOrders30d: z.number(),
  messageThreads30d: z.number(),
  negotiations30d: z.number(),
  sponsoredInteractions30d: z.number(),
  sponsorshipTraction: z.number(),
  retailerEngagement: z.number(),
  trustLevel: z.number().nullable(),
});
export type DistributorObservatoryRow = z.infer<typeof DistributorObservatoryRowSchema>;

export const DistributorObservatoryResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  rows: z.array(DistributorObservatoryRowSchema),
});
export type DistributorObservatoryResponse = z.infer<typeof DistributorObservatoryResponseSchema>;

export const RetailerRadarRowSchema = z.object({
  organizationId: z.string().uuid(),
  displayName: z.string(),
  segment: z.enum([
    "rising",
    "inactive",
    "cluster_core",
    "regional_pressure",
    "category_hot",
    "high_demand_zone",
  ]),
  velocityScore: z.number(),
  negotiationFrequency: z.number(),
  catalogTouches: z.number(),
  regionKey: z.string(),
  category: z.string(),
});
export type RetailerRadarRow = z.infer<typeof RetailerRadarRowSchema>;

export const GroupBuyingSignalsSchema = z.discriminatedUnion("available", [
  z.object({
    available: z.literal(true),
    sessions30d: z.number(),
    relationshipScopedSessions30d: z.number(),
  }),
  z.object({
    available: z.literal(false),
    reason: z.string(),
  }),
]);
export type GroupBuyingSignals = z.infer<typeof GroupBuyingSignalsSchema>;

export const RetailerRadarResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]).optional(),
  segmentSummary: z
    .object({
      active: z.number(),
      inactive: z.number(),
      rising: z.number(),
      regionalPressure: z.number(),
      other: z.number(),
    })
    .optional(),
  groupBuyingSignals: GroupBuyingSignalsSchema.optional(),
  rows: z.array(RetailerRadarRowSchema),
});
export type RetailerRadarResponse = z.infer<typeof RetailerRadarResponseSchema>;

export const ExpansionMapModeSchema = z.enum([
  "growth",
  "weak_network",
  "sponsorship",
  "retailer_pressure",
  "distributor_density",
  "inactive_territory",
]);
export type ExpansionMapMode = z.infer<typeof ExpansionMapModeSchema>;

export const CommercialExpansionMapResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  mode: ExpansionMapModeSchema,
  policy: z.enum(["ACTIVE", "DISABLED"]).optional(),
  legend: z.string(),
  cells: z.array(
    z.object({
      territoryKey: z.string(),
      label: z.string(),
      heat: z.number(),
      corridor: z.string().optional(),
      relationshipDensity: z.number(),
    }),
  ),
  controls: z.array(ExpansionMapModeSchema),
  mapEngine: z.literal("MapControlEngine_layers"),
});
export type CommercialExpansionMapResponse = z.infer<typeof CommercialExpansionMapResponseSchema>;

export const StabilityMatrixRowSchema = z.object({
  id: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  affectedOrganizationIds: z.array(z.string().uuid()),
  probableCause: z.string(),
  recommendation: z.string(),
  confidence: z.number(),
  pattern: z.string(),
});
export type StabilityMatrixRow = z.infer<typeof StabilityMatrixRowSchema>;

export const RelationshipStabilityMatrixResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]).optional(),
  rows: z.array(StabilityMatrixRowSchema),
});
export type RelationshipStabilityMatrixResponse = z.infer<typeof RelationshipStabilityMatrixResponseSchema>;

export const SponsorshipObservatoryResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  pressureIndex: z.number().optional(),
  sponsoredProductPenetration: z.number().optional(),
  overexposureRisk: z.number().optional(),
  effectivenessScore: z.number().optional(),
  relationshipPenetration: z.number().optional(),
  territoryImpact: z.array(z.object({ key: z.string(), score: z.number() })).optional(),
  activeInjectionsSample: z.number().optional(),
  engineReuse: z.literal("SponsoredInjectionEngineService"),
});
export type SponsorshipObservatoryResponse = z.infer<typeof SponsorshipObservatoryResponseSchema>;

export const NetworkInterventionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  expectedImpact: z.string(),
  affectedRegion: z.string().optional(),
  confidence: z.number(),
  relatedSignals: z.array(z.string()),
});
export type NetworkIntervention = z.infer<typeof NetworkInterventionSchema>;

export const NetworkInterventionsResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  interventions: z.array(NetworkInterventionSchema),
});
export type NetworkInterventionsResponse = z.infer<typeof NetworkInterventionsResponseSchema>;

export const CommercialBriefingResponseSchema = z.object({
  provider: z.literal("MockAIProvider"),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  title: z.string().optional(),
  executiveSummary: z.string().optional(),
  anomalies: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),
  recommendedActions: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  dataSources: z.array(z.string()).optional(),
  tone: z.string().optional(),
  note: z.string().optional(),
});
export type CommercialBriefingResponse = z.infer<typeof CommercialBriefingResponseSchema>;

export const CommercialNetworkBundleResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  overview: CommercialNetworkOverviewResponseSchema,
  relationships: CommercialRelationshipsResponseSchema,
  distributors: DistributorObservatoryResponseSchema,
  retailers: RetailerRadarResponseSchema,
  expansionMap: CommercialExpansionMapResponseSchema,
  stabilityMatrix: RelationshipStabilityMatrixResponseSchema,
  sponsorship: SponsorshipObservatoryResponseSchema,
  briefing: CommercialBriefingResponseSchema,
  interventions: NetworkInterventionsResponseSchema,
});
export type CommercialNetworkBundleResponse = z.infer<typeof CommercialNetworkBundleResponseSchema>;
