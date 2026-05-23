import { z } from "zod";

import { DataIntelligenceBundleResponseSchema } from "../data-intelligence/dtos.js";
import { EconomicCoordinationBundleSchema } from "../economic-coordination/dtos.js";
import { EconomicMemoryBundleSchema } from "../economic-memory/dtos.js";
import { EconomicPropagationBundleSchema } from "../economic-propagation/dtos.js";
import { EconomicScenariosBundleSchema } from "../economic-scenarios/dtos.js";

const unit = z.number().min(0).max(1);

export const EconomicCommandProjectionModeSchema = z.enum(["summary", "full"]);
export type EconomicCommandProjectionMode = z.infer<typeof EconomicCommandProjectionModeSchema>;

export const EconomicCommandPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type EconomicCommandPolicy = z.infer<typeof EconomicCommandPolicySchema>;

export const EconomicPressureZoneSchema = z.object({
  zoneId: z.string(),
  zoneType: z.string(),
  label: z.string(),
  pressureScore: unit,
  systemicWeight: unit,
  affectedPoles: z.array(z.string()).max(24),
  affectedTerritories: z.array(z.string()).max(24),
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string(),
  heuristicOnly: z.literal(true),
});
export type EconomicPressureZone = z.infer<typeof EconomicPressureZoneSchema>;

export const EconomicDecisionRiskSchema = z.object({
  riskId: z.string(),
  decisionLabel: z.string(),
  riskReason: z.string(),
  impactedPoles: z.array(z.string()).max(16),
  systemicExposure: unit,
  confidence: unit,
  explanation: z.string(),
  sourceSignals: z.array(z.string()).max(24),
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
});
export type EconomicDecisionRisk = z.infer<typeof EconomicDecisionRiskSchema>;

export const EconomicArbitrationSchema = z.object({
  arbitrationId: z.string(),
  arbitrationType: z.string(),
  involvedPoles: z.array(z.string()).max(16),
  tensionScore: unit,
  recommendedDirection: z.string(),
  tradeoffExplanation: z.string(),
  executiveAttentionRequired: z.boolean(),
  sourceSignals: z.array(z.string()).max(24),
  nonOperationalExecution: z.literal(true),
});
export type EconomicArbitration = z.infer<typeof EconomicArbitrationSchema>;

export const EconomicSystemStressSchema = z.object({
  globalStress: unit,
  logisticsStress: unit,
  financialStress: unit,
  relationshipStress: unit,
  coordinationStress: unit,
  silentStress: unit,
  scenarioStress: unit,
  stressMode: z.literal("PROXY_HEURISTIC"),
  explanation: z.string(),
  sourceSignals: z.array(z.string()).max(32),
});
export type EconomicSystemStress = z.infer<typeof EconomicSystemStressSchema>;

export const EconomicSilentTensionSchema = z.object({
  tensionId: z.string(),
  tensionType: z.string(),
  intensity: unit,
  confidence: unit,
  affectedPoles: z.array(z.string()).max(16),
  affectedTerritories: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(24),
  explanation: z.string(),
  heuristicOnly: z.literal(true),
});
export type EconomicSilentTension = z.infer<typeof EconomicSilentTensionSchema>;

/** HTTP slice bodies — arrays only (Instruction 18.5A client fallback parsing). */
export const EconomicCommandPressureZonesSliceSchema = z.array(EconomicPressureZoneSchema);
export const EconomicCommandDecisionRisksSliceSchema = z.array(EconomicDecisionRiskSchema);
export const EconomicCommandArbitrationsSliceSchema = z.array(EconomicArbitrationSchema);
export const EconomicCommandSilentTensionsSliceSchema = z.array(EconomicSilentTensionSchema);

export const EconomicExecutiveSignalSchema = z.object({
  signalId: z.string(),
  signalType: z.string(),
  headline: z.string(),
  intensity: unit,
  affectedPoles: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(24),
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
});
export type EconomicExecutiveSignal = z.infer<typeof EconomicExecutiveSignalSchema>;

export const EconomicCommandNarrativeSchema = z.object({
  narrativeMode: z.literal("HEURISTIC_EXECUTIVE_SUMMARY"),
  lines: z.array(z.string()).max(6),
  dominantPressure: z.string(),
  executiveWarning: z.string(),
  recommendedFocus: z.string(),
  limitations: z.string(),
});
export type EconomicCommandNarrative = z.infer<typeof EconomicCommandNarrativeSchema>;

export const EconomicCommandComposePlanSchema = z.object({
  propagationCompose: z.number().int().min(0).max(4),
  coordinationCompose: z.number().int().min(0).max(4),
  scenariosCompose: z.number().int().min(0).max(4),
  memoryCompose: z.number().int().min(0).max(4),
  dataIntelligenceCompose: z.number().int().min(0).max(4),
  commandCompose: z.number().int().min(0).max(4),
});
export type EconomicCommandComposePlan = z.infer<typeof EconomicCommandComposePlanSchema>;

export const EconomicCommandDiagnosticsSchema = z.object({
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicProjection: z.literal(true),
  nonOperationalExecution: z.literal(true),
  proxySignals: z.literal(true),
  sourceMode: z.string(),
  projectionMode: EconomicCommandProjectionModeSchema,
  payloadWeightClass: z.enum(["compact", "large"]),
  composeCacheHit: z.boolean(),
  cacheStrategy: z.literal("SHORT_TTL_COMMAND_CACHE"),
  /** @deprecated Use composePlan + composeCountMeaning — retained as sum(composePlan) for backward compatibility. */
  composeCount: z.number().int().min(0).max(64),
  composePlan: EconomicCommandComposePlanSchema,
  composeCountMeaning: z.literal("logical_pipeline_steps_not_cpu_cost"),
  costDisclosure: z.string().max(640),
  reusedBundles: z.array(z.string()).max(16),
  sourceBundlesEmbedded: z.boolean(),
  /** Present when projection=full — audit/debug warning for clients. */
  fullProjectionWarning: z.string().max(480).optional(),
});
export type EconomicCommandDiagnostics = z.infer<typeof EconomicCommandDiagnosticsSchema>;

export const EconomicCommandOverviewSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicCommandPolicySchema,
  headline: z.string(),
  executivePosture: z.string(),
  dominantStress: z.string(),
  tensionCount: z.number().int().min(0).max(128),
  pressureZoneCount: z.number().int().min(0).max(64),
  riskCount: z.number().int().min(0).max(64),
  arbitrationCount: z.number().int().min(0).max(64),
  signalDigest: z.string(),
});
export type EconomicCommandOverview = z.infer<typeof EconomicCommandOverviewSchema>;

export const EconomicCommandSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  propagationBundle: EconomicPropagationBundleSchema,
  scenariosBundle: EconomicScenariosBundleSchema,
  coordinationBundle: EconomicCoordinationBundleSchema,
  memoryBundle: EconomicMemoryBundleSchema,
  dataIntelligenceBundle: DataIntelligenceBundleResponseSchema,
  pressureSignals: z.array(EconomicPressureZoneSchema).max(24),
  decisionRiskSignals: z.array(EconomicDecisionRiskSchema).max(24),
  silentTensionSignals: z.array(EconomicSilentTensionSchema).max(24),
  executiveSignals: z.array(EconomicExecutiveSignalSchema).max(24),
});
export type EconomicCommandSnapshot = z.infer<typeof EconomicCommandSnapshotSchema>;

export const EconomicCommandSourceBundlesSchema = z.object({
  propagationBundle: EconomicPropagationBundleSchema,
  scenariosBundle: EconomicScenariosBundleSchema,
  coordinationBundle: EconomicCoordinationBundleSchema,
  memoryBundle: EconomicMemoryBundleSchema,
  dataIntelligenceBundle: DataIntelligenceBundleResponseSchema,
});
export type EconomicCommandSourceBundles = z.infer<typeof EconomicCommandSourceBundlesSchema>;

export const EconomicCommandBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicCommandPolicySchema,
  disclaimer: z.string(),
  overview: EconomicCommandOverviewSchema,
  pressureZones: z.array(EconomicPressureZoneSchema).max(24),
  decisionRisks: z.array(EconomicDecisionRiskSchema).max(24),
  arbitrations: z.array(EconomicArbitrationSchema).max(16),
  systemStress: EconomicSystemStressSchema,
  silentTensions: z.array(EconomicSilentTensionSchema).max(24),
  narrative: EconomicCommandNarrativeSchema,
  executiveSignals: z.array(EconomicExecutiveSignalSchema).max(24),
  diagnostics: EconomicCommandDiagnosticsSchema,
  /** Present when `projection=full` — embedded upstream bundles + signal mirrors for audit. */
  snapshot: EconomicCommandSnapshotSchema.optional(),
  sourceBundles: EconomicCommandSourceBundlesSchema.optional(),
  sourceMode: z.enum(["LIVE_ECONOMIC_COMMAND_COMPOSE", "SEQUENTIAL_SLICE_FALLBACK"]).optional(),
  /** Client-side sequential recovery — partial bundle, not a cold server compose. */
  degraded: z.boolean().optional(),
  missingSlices: z.array(z.string()).max(32).optional(),
});
export type EconomicCommandBundle = z.infer<typeof EconomicCommandBundleSchema>;
