import { z } from "zod";

export const MarketPressureBandSchema = z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]);
export type MarketPressureBand = z.infer<typeof MarketPressureBandSchema>;

export const StrategicOverviewResponseSchema = z.object({
  generatedAt: z.string(),
  strategicCapsules: z.record(z.unknown()),
  crossPoleLayer: z.record(z.unknown()),
});
export type StrategicOverviewResponse = z.infer<typeof StrategicOverviewResponseSchema>;

export const StrategicSignalRadarResponseSchema = z.object({
  generatedAt: z.string(),
  internal: z.array(z.record(z.unknown())),
  external: z.array(z.record(z.unknown())),
  correlation: z.array(z.record(z.unknown())),
  sourcesLegend: z.object({ internal: z.string(), external: z.string() }),
});
export type StrategicSignalRadarResponse = z.infer<typeof StrategicSignalRadarResponseSchema>;

export const DistributionNetworkResponseSchema = z.record(z.unknown());
export type DistributionNetworkResponse = z.infer<typeof DistributionNetworkResponseSchema>;

export const MarketPressureResponseSchema = z.record(z.unknown());
export type MarketPressureResponse = z.infer<typeof MarketPressureResponseSchema>;

export const TerritoryOpportunityResponseSchema = z.record(z.unknown());
export type TerritoryOpportunityResponse = z.infer<typeof TerritoryOpportunityResponseSchema>;

export const StrategicRiskMatrixResponseSchema = z.record(z.unknown());
export type StrategicRiskMatrixResponse = z.infer<typeof StrategicRiskMatrixResponseSchema>;

export const ExecutiveBriefingResponseSchema = z.object({
  provider: z.literal("MockAIProvider"),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  title: z.string().optional(),
  executiveSummary: z.string().optional(),
  anomalies: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),
  recommendedActions: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  dataSources: z.array(z.string()).optional(),
  /** Legacy shape — retained for clients not yet on structured fields */
  headline: z.string().optional(),
  sections: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
  tone: z.string().optional(),
  note: z.string().optional(),
});
export type ExecutiveBriefingResponse = z.infer<typeof ExecutiveBriefingResponseSchema>;

export const ExecutiveQueueResponseSchema = z.object({
  generatedAt: z.string(),
  actions: z.array(z.record(z.unknown())),
});
export type ExecutiveQueueResponse = z.infer<typeof ExecutiveQueueResponseSchema>;

export const StrategicBundleResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  overview: StrategicOverviewResponseSchema,
  signals: StrategicSignalRadarResponseSchema,
  distributionNetwork: DistributionNetworkResponseSchema,
  marketPressure: MarketPressureResponseSchema,
  territoryOpportunities: TerritoryOpportunityResponseSchema,
  riskMatrix: StrategicRiskMatrixResponseSchema,
  executiveBriefing: ExecutiveBriefingResponseSchema,
  executiveQueue: ExecutiveQueueResponseSchema,
});
export type StrategicBundleResponse = z.infer<typeof StrategicBundleResponseSchema>;
