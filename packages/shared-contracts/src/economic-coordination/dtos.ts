import { z } from "zod";

import { DataIntelligenceBundleResponseSchema } from "../data-intelligence/dtos.js";
import { EconomicMemoryBundleSchema } from "../economic-memory/dtos.js";
import { EconomicPropagationBundleSchema } from "../economic-propagation/dtos.js";
import { EconomicScenariosBundleSchema } from "../economic-scenarios/dtos.js";

const unit = z.number().min(0).max(1);

export const EconomicCoordinationProjectionSchema = z.enum(["summary", "full"]);
export type EconomicCoordinationProjection = z.infer<typeof EconomicCoordinationProjectionSchema>;

export const EconomicCoordinationPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type EconomicCoordinationPolicy = z.infer<typeof EconomicCoordinationPolicySchema>;

export const EconomicPostureCodeSchema = z.enum([
  "STABLE",
  "EXPANSION_PRESSURE",
  "FRAGILE_GROWTH",
  "LIQUIDITY_STRAIN",
  "DISTRIBUTION_SATURATION",
  "RELATIONSHIP_FRAGMENTATION",
  "MULTI_POLE_TENSION",
  "RECOVERY_WINDOW",
  "SYSTEMIC_INSTABILITY",
]);
export type EconomicPostureCode = z.infer<typeof EconomicPostureCodeSchema>;

export const EconomicPostureSchema = z.object({
  posture: EconomicPostureCodeSchema,
  confidence: unit,
  systemicRisk: unit,
  coordinationStress: unit,
  explanation: z.string(),
  sourceSignals: z.array(z.string()).max(48),
  affectedPoles: z.array(z.string()).max(24),
  affectedTerritories: z.array(z.string()).max(32),
});
export type EconomicPosture = z.infer<typeof EconomicPostureSchema>;

export const CrossPolePrioritySchema = z.object({
  priorityId: z.string(),
  priorityScore: unit,
  priorityReason: z.string(),
  sourceSignals: z.array(z.string()).max(32),
  affectedPoles: z.array(z.string()).max(16),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  timeHorizon: z.enum(["IMMEDIATE", "SHORT", "MEDIUM", "LONG"]),
});
export type CrossPolePriority = z.infer<typeof CrossPolePrioritySchema>;

export const CoordinationConflictSchema = z.object({
  conflictId: z.string(),
  conflictType: z.string(),
  involvedPoles: z.array(z.string()).max(16),
  recommendationCollision: z.string(),
  systemicImpact: unit,
  severity: unit,
  arbitrationDirection: z.string(),
  diagnostics: z.array(z.string()).max(12),
});
export type CoordinationConflict = z.infer<typeof CoordinationConflictSchema>;

export const EconomicEscalationLevelSchema = z.enum(["LOW", "ELEVATED", "HIGH", "CRITICAL"]);
export type EconomicEscalationLevel = z.infer<typeof EconomicEscalationLevelSchema>;

export const EconomicEscalationSchema = z.object({
  escalationLevel: EconomicEscalationLevelSchema,
  escalationScore: unit,
  escalationDrivers: z.array(z.string()).max(24),
  affectedPoles: z.array(z.string()).max(16),
  coordinationRecommendation: z.string(),
  executiveAttentionRequired: z.boolean(),
  diagnostics: z.array(z.string()).max(12),
});
export type EconomicEscalation = z.infer<typeof EconomicEscalationSchema>;

export const CoordinationRecommendationSchema = z.object({
  order: z.number().int().min(0).max(64),
  pole: z.string(),
  headline: z.string(),
  rationale: z.string(),
  symbolicCoordinationOnly: z.literal(true),
});
export type CoordinationRecommendation = z.infer<typeof CoordinationRecommendationSchema>;

export const ResponseOrchestrationSchema = z.object({
  orchestrationId: z.string(),
  title: z.string(),
  rationale: z.string(),
  orderedRecommendations: z.array(CoordinationRecommendationSchema).max(24),
  coordinationObjective: z.string(),
  affectedPoles: z.array(z.string()).max(16),
  expectedStabilization: unit,
  executionComplexity: unit,
  coordinationRisk: unit,
});
export type ResponseOrchestration = z.infer<typeof ResponseOrchestrationSchema>;

export const CoordinationMemorySignalSchema = z.object({
  patternCode: z.string(),
  weight: unit,
  explanation: z.string(),
});
export type CoordinationMemorySignal = z.infer<typeof CoordinationMemorySignalSchema>;

export const EconomicCoordinationMemoryBlockSchema = z.object({
  recurringPatterns: z.array(z.string()).max(24),
  recurringConflicts: z.array(z.string()).max(24),
  recurringStabilizationPatterns: z.array(z.string()).max(24),
  memoryConfidence: unit,
  historicalSimilarity: unit,
  signals: z.array(CoordinationMemorySignalSchema).max(16),
  diagnostics: z.array(z.string()).max(12),
});
export type EconomicCoordinationMemoryBlock = z.infer<typeof EconomicCoordinationMemoryBlockSchema>;

export const EconomicCoordinationOverviewSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicCoordinationPolicySchema,
  headline: z.string(),
  activeConflictCount: z.number().int().min(0).max(64),
  priorityCount: z.number().int().min(0).max(32),
  orchestrationCount: z.number().int().min(0).max(16),
  posture: EconomicPostureCodeSchema,
  escalationLevel: EconomicEscalationLevelSchema,
  systemicRiskRollup: unit,
  coordinationStressRollup: unit,
  realtimePressure: unit,
  organizationSignals: unit,
  /** Proxy derived from Data Intelligence `economicPropagationScore`, not a strategy-department signal. */
  systemicIntelligencePressure: unit,
  operationalPressure: unit,
  financialPressure: unit,
  logisticsPressure: unit,
  diagnostics: z
    .object({
      composeCache: z.literal("SHORT_TTL_COORDINATION_CACHE"),
      composeCacheHit: z.boolean(),
      cacheStrategy: z.literal("SHORT_TTL_COORDINATION_CACHE"),
      snapshotReuse: z.literal("SINGLE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI"),
      payloadProjection: EconomicCoordinationProjectionSchema.optional(),
      sourceBundlesEmbedded: z.boolean().optional(),
      strategicPressureSource: z.literal("DATA_INTELLIGENCE_ECONOMIC_PROPAGATION_SCORE").optional(),
      strategicPressureLabel: z.string().optional(),
    })
    .optional(),
});
export type EconomicCoordinationOverview = z.infer<typeof EconomicCoordinationOverviewSchema>;

export const EconomicCoordinationSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  propagationBundle: EconomicPropagationBundleSchema,
  scenariosBundle: EconomicScenariosBundleSchema,
  memoryContext: EconomicMemoryBundleSchema,
  dataIntelligenceBundle: DataIntelligenceBundleResponseSchema,
  realtimePressure: unit,
  organizationSignals: unit,
  systemicIntelligencePressure: unit,
  operationalPressure: unit,
  financialPressure: unit,
  logisticsPressure: unit,
});
export type EconomicCoordinationSnapshot = z.infer<typeof EconomicCoordinationSnapshotSchema>;

export const EconomicCoordinationSourceBundlesSchema = z.object({
  propagationBundle: EconomicPropagationBundleSchema,
  scenariosBundle: EconomicScenariosBundleSchema,
  memoryContext: EconomicMemoryBundleSchema,
  dataIntelligenceBundle: DataIntelligenceBundleResponseSchema,
});
export type EconomicCoordinationSourceBundles = z.infer<typeof EconomicCoordinationSourceBundlesSchema>;

export const EconomicCoordinationBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicCoordinationPolicySchema,
  headline: z.string(),
  disclaimer: z.string(),
  overview: EconomicCoordinationOverviewSchema,
  posture: EconomicPostureSchema,
  priorities: z.array(CrossPolePrioritySchema).max(16),
  conflicts: z.array(CoordinationConflictSchema).max(24),
  orchestrations: z.array(ResponseOrchestrationSchema).max(8),
  escalation: EconomicEscalationSchema,
  memory: EconomicCoordinationMemoryBlockSchema,
  diagnostics: z.object({
    composeCacheHit: z.boolean(),
    cacheStrategy: z.literal("SHORT_TTL_COORDINATION_CACHE"),
    coordinationPipeline: z.enum([
      "REUSE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI",
      "DISABLED",
    ]),
    sourceLabels: z.array(z.string()).max(16),
    payloadProjection: EconomicCoordinationProjectionSchema,
    sourceBundlesEmbedded: z.boolean(),
    dataIntelligenceReuse: z.enum(["FROM_PROPAGATION", "DIRECT_COMPOSE", "UNAVAILABLE"]),
    dataIntelligenceComposeCount: z.number().int().min(0).max(2),
  }),
  /** Present only when `projection=full` — upstream compose payloads for audit/debug (18.4A). */
  sourceBundles: EconomicCoordinationSourceBundlesSchema.optional(),
  sourceMode: z.literal("LIVE_COORDINATION_COMPOSE").optional(),
  liveComposeDiagnostics: z
    .object({
      composeCacheHit: z.boolean(),
      cacheStrategy: z.literal("SHORT_TTL_COORDINATION_CACHE"),
      serverCost: z.literal("FULL_COMPOSE"),
    })
    .optional(),
});
export type EconomicCoordinationBundle = z.infer<typeof EconomicCoordinationBundleSchema>;

