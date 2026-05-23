import { z } from "zod";

/** Stimulation / tension strip (not impressions). */
export const ActivationSignalStripSchema = z.object({
  id: z.string(),
  band: z.string(),
  tension: z.number(),
  vector: z.enum(["inbound", "outbound", "lateral", "compress"]),
  label: z.string(),
});
export type ActivationSignalStrip = z.infer<typeof ActivationSignalStripSchema>;

export const SeasonalPressureSchema = z.object({
  source: z.string(),
  intensity: z.number(),
  affectedTerritories: z.array(z.string()),
  affectedCategories: z.array(z.string()),
  confidence: z.number(),
  explanation: z.string(),
});
export type SeasonalPressure = z.infer<typeof SeasonalPressureSchema>;

export const MarketingActivationOverviewResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  sponsorshipPressure: z.number(),
  activationVelocity: z.number(),
  retailerEngagementLevel: z.number(),
  productMomentum: z.number(),
  campaignEffectiveness: z.number(),
  territoryStimulation: z.number(),
  inactiveActivationZones: z.number(),
  commercialExcitation: z.number(),
  activationConfidence: z.number(),
  signalStrips: z.array(ActivationSignalStripSchema),
  seasonalPressure: SeasonalPressureSchema.optional(),
});
export type MarketingActivationOverviewResponse = z.infer<typeof MarketingActivationOverviewResponseSchema>;

export const SponsorshipPressureSignalSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "watch", "elevated", "critical"]),
  headline: z.string(),
  detail: z.string(),
});
export type SponsorshipPressureSignal = z.infer<typeof SponsorshipPressureSignalSchema>;

export const SponsorshipPressureObservatoryResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  engineReuse: z.literal("SponsoredInjectionEngineService"),
  overexposureIndex: z.number().optional(),
  efficiencyIndex: z.number().optional(),
  territorySaturation: z.number().optional(),
  risingSponsoredProducts: z.number().optional(),
  sponsorshipDecay: z.number().optional(),
  retailerAttraction: z.number().optional(),
  concentrationRisk: z.number().optional(),
  signals: z.array(SponsorshipPressureSignalSchema).optional(),
  note: z.string().optional(),
});
export type SponsorshipPressureObservatoryResponse = z.infer<typeof SponsorshipPressureObservatoryResponseSchema>;

export const TerritoryActivationRowSchema = z.object({
  territoryKey: z.string(),
  label: z.string(),
  stimulationScore: z.number(),
  orderPulse: z.number(),
  sponsorshipSpread: z.number(),
  negotiationHeat: z.number(),
  state: z.enum(["rising", "dormant", "weak", "corridor", "saturated"]),
});
export type TerritoryActivationRow = z.infer<typeof TerritoryActivationRowSchema>;

export const TerritoryActivationRadarResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  rows: z.array(TerritoryActivationRowSchema),
  risingCorridors: z.array(z.string()),
  dormantRegions: z.array(z.string()),
  seasonalPressure: SeasonalPressureSchema.optional(),
});
export type TerritoryActivationRadarResponse = z.infer<typeof TerritoryActivationRadarResponseSchema>;

export const ProductMomentumRowSchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  momentumScore: z.number(),
  orderGrowth30d: z.number(),
  priorOrderGrowth30d: z.number(),
  negotiationVelocity: z.number(),
  sponsorshipAssisted: z.boolean(),
  territoryPenetration: z.number(),
  state: z.enum(["rising", "declining", "spike", "seasonal", "stagnant", "stable"]),
});
export type ProductMomentumRow = z.infer<typeof ProductMomentumRowSchema>;

export const ProductMomentumObservatoryResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  rows: z.array(ProductMomentumRowSchema),
});
export type ProductMomentumObservatoryResponse = z.infer<typeof ProductMomentumObservatoryResponseSchema>;

export const RetailerEngagementRowSchema = z.object({
  organizationId: z.string().uuid(),
  displayName: z.string(),
  engagementScore: z.number(),
  activationSensitivity: z.number(),
  sponsorshipReactivity: z.number(),
  cluster: z.enum(["high", "weak", "dormant", "sensitive", "sponsor_reactive", "mixed"]),
  regionKey: z.string(),
});
export type RetailerEngagementRow = z.infer<typeof RetailerEngagementRowSchema>;

export const RetailerEngagementObservatoryResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  /** Instruction 13A — batched findMany + in-memory aggregation (no per-retailer Prisma loop). */
  aggregationStrategy: z.literal("BATCHED_FINDMANY_V1").optional(),
  segmentCounts: z.object({
    highlyEngaged: z.number(),
    weaklyEngaged: z.number(),
    dormant: z.number(),
    activationSensitive: z.number(),
    sponsorReactive: z.number(),
  }),
  rows: z.array(RetailerEngagementRowSchema),
});
export type RetailerEngagementObservatoryResponse = z.infer<typeof RetailerEngagementObservatoryResponseSchema>;

export const ActivationCampaignRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["activation_wave", "sponsorship_wave", "territory_push", "retailer_stimulus", "synthetic_derived"]),
  efficiency: z.number(),
  decayIndex: z.number(),
  territoryKeys: z.array(z.string()),
  status: z.enum(["active", "cooling", "weak", "declining"]),
});
export type ActivationCampaignRow = z.infer<typeof ActivationCampaignRowSchema>;

export const CampaignIntelligenceResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  layer: z.literal("ACTIVATION_CAMPAIGN_ABSTRACTION_V1"),
  moduleNote: z.string(),
  campaigns: z.array(ActivationCampaignRowSchema),
  abstractionProvider: z.literal("ActivationCampaignProvider_V1").optional(),
});
export type CampaignIntelligenceResponse = z.infer<typeof CampaignIntelligenceResponseSchema>;

export const ActivationOpportunityMapModeSchema = z.enum([
  "momentum",
  "dormant",
  "sponsorship",
  "retailer_engagement",
  "territory_stimulation",
  "activation_decay",
]);
export type ActivationOpportunityMapMode = z.infer<typeof ActivationOpportunityMapModeSchema>;

export const ActivationOpportunityCellSchema = z.object({
  territoryKey: z.string(),
  label: z.string(),
  heat: z.number(),
  corridor: z.string().optional(),
  modeHint: z.string().optional(),
});
export type ActivationOpportunityCell = z.infer<typeof ActivationOpportunityCellSchema>;

export const ActivationMapModeComputationSchema = z.object({
  mode: ActivationOpportunityMapModeSchema,
  primarySignals: z.array(z.string()),
  formulaVersion: z.string(),
  mockContextUsed: z.boolean(),
});
export type ActivationMapModeComputation = z.infer<typeof ActivationMapModeComputationSchema>;

export const ActivationOpportunityMapResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  mode: ActivationOpportunityMapModeSchema,
  legend: z.string(),
  cells: z.array(ActivationOpportunityCellSchema),
  controls: z.array(ActivationOpportunityMapModeSchema),
  mapEngine: z.literal("MapControlEngine_layers"),
  policy: z.enum(["ACTIVE", "DISABLED"]).optional(),
  modeComputation: ActivationMapModeComputationSchema.optional(),
});
export type ActivationOpportunityMapResponse = z.infer<typeof ActivationOpportunityMapResponseSchema>;

export const MarketingActivationBriefingResponseSchema = z.object({
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
export type MarketingActivationBriefingResponse = z.infer<typeof MarketingActivationBriefingResponseSchema>;

export const InterventionRankingBasisSchema = z.object({
  urgencyScore: z.number(),
  impactScore: z.number(),
  confidenceScore: z.number(),
  signalStrengthScore: z.number(),
  /** Instruction 16A — aligned with order-adv / supply intervention ranking basis. */
  territoryFactor: z.number().optional(),
  finalScore: z.number(),
});
export type InterventionRankingBasis = z.infer<typeof InterventionRankingBasisSchema>;

export const ActivationInterventionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  expectedImpact: z.string(),
  affectedTerritories: z.array(z.string()),
  confidence: z.number(),
  relatedSignals: z.array(z.string()),
  rankingBasis: InterventionRankingBasisSchema.optional(),
  finalScore: z.number().optional(),
});
export type ActivationIntervention = z.infer<typeof ActivationInterventionSchema>;

export const ActivationInterventionsResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  interventions: z.array(ActivationInterventionSchema),
});
export type ActivationInterventionsResponse = z.infer<typeof ActivationInterventionsResponseSchema>;

export const MarketingActivationBundleResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  overview: MarketingActivationOverviewResponseSchema,
  sponsorshipPressure: SponsorshipPressureObservatoryResponseSchema,
  territoryRadar: TerritoryActivationRadarResponseSchema,
  productMomentum: ProductMomentumObservatoryResponseSchema,
  retailerEngagement: RetailerEngagementObservatoryResponseSchema,
  campaigns: CampaignIntelligenceResponseSchema,
  opportunityMap: ActivationOpportunityMapResponseSchema,
  briefing: MarketingActivationBriefingResponseSchema,
  interventions: ActivationInterventionsResponseSchema,
});
export type MarketingActivationBundleResponse = z.infer<typeof MarketingActivationBundleResponseSchema>;
