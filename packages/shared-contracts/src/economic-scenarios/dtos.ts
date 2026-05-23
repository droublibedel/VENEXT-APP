import { z } from "zod";

export const EconomicScenariosPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type EconomicScenariosPolicy = z.infer<typeof EconomicScenariosPolicySchema>;

export const ScenarioTrajectoryStepSchema = z.object({
  label: z.enum(["T0", "T1", "T2", "T3"]),
  systemicRisk: z.number().min(0).max(1),
  unstableTerritories: z.array(z.string()).max(24),
  impactedPoles: z.array(z.string()).max(16),
  stabilizationTrend: z.enum(["IMPROVING", "FLAT", "DEGRADING"]),
  volatilityShift: z.enum(["DOWN", "FLAT", "UP"]),
  propagationAcceleration: z.number().min(0).max(2),
});
export type ScenarioTrajectoryStep = z.infer<typeof ScenarioTrajectoryStepSchema>;

export const ScenarioTrajectoryPackSchema = z.object({
  provenance: z.array(z.string()).max(16),
  steps: z.array(ScenarioTrajectoryStepSchema).min(1).max(4),
});
export type ScenarioTrajectoryPack = z.infer<typeof ScenarioTrajectoryPackSchema>;

export const ScenarioImpactRowSchema = z.object({
  targetPole: z.string(),
  impactKind: z.string(),
  intensity: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  sourceSignals: z.array(z.string()).max(20),
  /** Propagation chain id when derived from a real chain; omitted for synthetic fallback. */
  chainId: z.string().optional(),
  /** Root shock type from the chain that produced this impact. */
  rootShockType: z.string().optional(),
  /** Count of propagation chains considered when building impacts (Instruction 18.3A). */
  sourceChainCount: z.number().int().min(0).max(64).optional(),
  /** `SYNTHETIC_FALLBACK` when not derived from observed propagation impacts. */
  source: z.string().optional(),
  /** False for heuristic / synthetic projection rows. */
  observational: z.boolean().optional(),
  explanation: z.string().optional(),
});
export type ScenarioImpactRow = z.infer<typeof ScenarioImpactRowSchema>;

export const ScenarioRiskAssessmentSchema = z.object({
  collapseProbability: z.number().min(0).max(1),
  networkStress: z.number().min(0).max(1),
  liquidityThreat: z.number().min(0).max(1),
  supplyBreakRisk: z.number().min(0).max(1),
  strategicExposure: z.number().min(0).max(1),
  recoveryComplexity: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  sourceSignals: z.array(z.string()).max(24),
});
export type ScenarioRiskAssessment = z.infer<typeof ScenarioRiskAssessmentSchema>;

export const StabilizationDirectionSchema = z.object({
  code: z.string(),
  label: z.string(),
  expectedEffect: z.string(),
  estimatedConfidence: z.number().min(0).max(1),
});
export type StabilizationDirection = z.infer<typeof StabilizationDirectionSchema>;

export const ScenarioStabilizationProposalSchema = z.object({
  stabilizationDirections: z.array(StabilizationDirectionSchema).max(12),
  note: z.string(),
});
export type ScenarioStabilizationProposal = z.infer<typeof ScenarioStabilizationProposalSchema>;

export const ScenarioMemoryLinkSchema = z.object({
  historicalSimilarity: z.number().min(0).max(1),
  matchedHistoricalPatterns: z.array(z.string()).max(16),
  recurrenceLikelihood: z.number().min(0).max(1),
  explanation: z.string(),
  dataSources: z.array(z.string()).max(16),
});
export type ScenarioMemoryLink = z.infer<typeof ScenarioMemoryLinkSchema>;

export const EconomicScenarioProjectionSchema = z.object({
  scenarioCode: z.string(),
  scenarioType: z.string(),
  triggerType: z.string(),
  severity: z.string(),
  sourcePole: z.string(),
  confidence: z.number().min(0).max(1),
  affectedPoles: z.array(z.string()).max(16),
  affectedTerritories: z.array(z.string()).max(24),
  projectedRisk: z.number().min(0).max(1),
  stabilizationProbability: z.number().min(0).max(1),
  estimatedPropagationDepth: z.number().int().min(0).max(32),
  trajectory: ScenarioTrajectoryPackSchema,
  impacts: z.array(ScenarioImpactRowSchema).max(24),
  risk: ScenarioRiskAssessmentSchema.optional(),
  stabilization: ScenarioStabilizationProposalSchema.optional(),
  memoryLink: ScenarioMemoryLinkSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type EconomicScenarioProjection = z.infer<typeof EconomicScenarioProjectionSchema>;

export const ScenarioComparisonRowSchema = z.object({
  scenarioA: z.object({ scenarioCode: z.string(), scenarioType: z.string() }),
  scenarioB: z.object({ scenarioCode: z.string(), scenarioType: z.string() }),
  similarityScore: z.number().min(0).max(1),
  escalationGap: z.number(),
  stabilizationGap: z.number(),
  systemicDifference: z.number(),
  collapseSpeedHint: z.string(),
  recoveryHint: z.string(),
  territoriesAffectedDelta: z.number().int(),
});
export type ScenarioComparisonRow = z.infer<typeof ScenarioComparisonRowSchema>;

export const EconomicScenariosOverviewSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicScenariosPolicySchema,
  headline: z.string(),
  scenarioCount: z.number().int().min(0),
  maxProjectedRisk: z.number().min(0).max(1),
  meanStabilizationProbability: z.number().min(0).max(1),
  dominantScenarioTypes: z.array(z.string()).max(12),
  diagnostics: z
    .object({
      cacheStrategy: z.literal("SHORT_TTL_SCENARIO_CACHE").optional(),
      cacheKey: z.string().optional(),
      composeCacheHit: z.boolean().optional(),
      memoryPrefetch: z.boolean().optional(),
      memoryPrefetchCount: z.number().int().min(0).optional(),
      memoryReuseStrategy: z.literal("COMPOSE_LEVEL_MEMORY_CONTEXT").optional(),
    })
    .optional(),
});
export type EconomicScenariosOverview = z.infer<typeof EconomicScenariosOverviewSchema>;

/** Slice endpoints return the same composed bundle data with explicit server-cost metadata (Instruction 18.3A Option A). */
export const EconomicScenariosSliceDiagnosticsSchema = z.object({
  sliceSource: z.literal("FULL_BUNDLE_SLICE"),
  serverCost: z.literal("FULL_COMPOSE"),
  cacheStrategy: z.literal("SHORT_TTL_SCENARIO_CACHE"),
  composeCacheHit: z.boolean(),
});
export type EconomicScenariosSliceDiagnostics = z.infer<typeof EconomicScenariosSliceDiagnosticsSchema>;

export const EconomicScenariosSliceEnvelopeSchema = z.object({
  data: z.unknown(),
  sliceDiagnostics: EconomicScenariosSliceDiagnosticsSchema,
});
export type EconomicScenariosSliceEnvelope = z.infer<typeof EconomicScenariosSliceEnvelopeSchema>;

export const EconomicScenarioBriefingSchema = z.object({
  provider: z.enum(["MockAIProvider"]),
  providerMode: z.enum(["MOCK_PROVIDER", "DISABLED"]).optional(),
  realLLMConnected: z.boolean().optional(),
  mockContextUsed: z.boolean().optional(),
  policy: EconomicScenariosPolicySchema,
  title: z.string(),
  executiveSummary: z.string(),
  scenarioContrast: z.array(z.string()).max(12),
  riskHighlights: z.array(z.string()).max(12),
  memoryHighlights: z.array(z.string()).max(12),
  limits: z.array(z.string()).max(12),
  confidence: z.number().min(0).max(1),
  dataSources: z.array(z.string()).max(24),
  tone: z.literal("industrial_economic_scenarios"),
  note: z.string(),
});
export type EconomicScenarioBriefing = z.infer<typeof EconomicScenarioBriefingSchema>;

export const EconomicScenariosBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicScenariosPolicySchema,
  headline: z.string(),
  disclaimer: z.string(),
  overview: EconomicScenariosOverviewSchema,
  scenarios: z.array(EconomicScenarioProjectionSchema).max(16),
  comparisons: z.array(ScenarioComparisonRowSchema).max(24),
  briefing: EconomicScenarioBriefingSchema.optional(),
  sourceMode: z.literal("LIVE_COMPOSED_SCENARIO").optional(),
  liveComposeDiagnostics: z
    .object({
      composeCacheHit: z.boolean(),
      cacheStrategy: z.literal("SHORT_TTL_SCENARIO_CACHE"),
      serverCost: z.literal("FULL_COMPOSE"),
    })
    .optional(),
});
export type EconomicScenariosBundle = z.infer<typeof EconomicScenariosBundleSchema>;
