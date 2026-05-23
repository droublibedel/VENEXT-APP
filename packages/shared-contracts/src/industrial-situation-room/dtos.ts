import { z } from "zod";

const unit = z.number().min(0).max(1);

export const IndustrialSituationRoomProjectionModeSchema = z.enum(["summary", "full"]);
export type IndustrialSituationRoomProjectionMode = z.infer<typeof IndustrialSituationRoomProjectionModeSchema>;

export const IndustrialSituationRoomPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type IndustrialSituationRoomPolicy = z.infer<typeof IndustrialSituationRoomPolicySchema>;

export const SituationCellTypeSchema = z.enum([
  "crisis_cell",
  "supply_recovery_cell",
  "distribution_watch_cell",
  "liquidity_pressure_cell",
  "strategic_alignment_cell",
  "industrial_attention_cell",
]);
export type SituationCellType = z.infer<typeof SituationCellTypeSchema>;

export const IndustrialSituationCellSchema = z.object({
  cellId: z.string(),
  cellType: SituationCellTypeSchema,
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  confidence: unit,
  urgency: unit,
  stabilizationPotential: unit,
  coordinationLoad: unit,
  affectedPoles: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type IndustrialSituationCell = z.infer<typeof IndustrialSituationCellSchema>;

export const OperationalMissionTypeSchema = z.enum([
  "stabilization",
  "containment",
  "monitoring",
  "escalation",
  "dependency_review",
]);
export type OperationalMissionType = z.infer<typeof OperationalMissionTypeSchema>;

export const IndustrialOperationalMissionSchema = z.object({
  missionCode: z.string(),
  missionType: OperationalMissionTypeSchema,
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  operationalWeight: unit,
  expectedImpact: unit,
  executionComplexity: unit,
  stabilizationPriority: unit,
  affectedPoles: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type IndustrialOperationalMission = z.infer<typeof IndustrialOperationalMissionSchema>;

export const CriticalDependencyKindSchema = z.enum([
  "upstream",
  "downstream",
  "fragile_bridge",
  "choke_point",
  "systemic_bottleneck",
]);
export type CriticalDependencyKind = z.infer<typeof CriticalDependencyKindSchema>;

export const IndustrialCriticalDependencySchema = z.object({
  dependencyId: z.string(),
  kind: CriticalDependencyKindSchema,
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  fragility: unit,
  systemicExposure: unit,
  involvedPoles: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type IndustrialCriticalDependency = z.infer<typeof IndustrialCriticalDependencySchema>;

export const ExecutiveAttentionKindSchema = z.enum([
  "executive_attention_zone",
  "board_attention_alert",
  "operational_saturation_warning",
  "cross_pole_overload_warning",
]);
export type ExecutiveAttentionKind = z.infer<typeof ExecutiveAttentionKindSchema>;

export const IndustrialExecutiveAttentionSchema = z.object({
  attentionId: z.string(),
  kind: ExecutiveAttentionKindSchema,
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  intensity: unit,
  affectedPoles: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type IndustrialExecutiveAttention = z.infer<typeof IndustrialExecutiveAttentionSchema>;

export const IndustrialSituationBriefingsSchema = z.object({
  executiveLines: z.array(z.string()).max(8),
  operationalLines: z.array(z.string()).max(8),
  stabilizationLines: z.array(z.string()).max(8),
});
export type IndustrialSituationBriefings = z.infer<typeof IndustrialSituationBriefingsSchema>;

export const IndustrialSituationRoomSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  snapshotSource: z.enum(["LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE", "DISABLED"]),
  economicCommandDigest: z.object({
    bundleGeneratedAt: z.string(),
    headline: z.string(),
    pressureZoneCount: z.number().int().min(0).max(64),
    riskCount: z.number().int().min(0).max(64),
    arbitrationCount: z.number().int().min(0).max(64),
    globalStress: unit,
    executivePosture: z.string(),
    dominantStress: z.string(),
  }),
});
export type IndustrialSituationRoomSnapshot = z.infer<typeof IndustrialSituationRoomSnapshotSchema>;

/** Flat compose plan — mirrors upstream economic-command pipeline counters + situation-room synthesis (Instruction 18.6). */
export const IndustrialSituationRoomComposePlanSchema = z.object({
  propagationCompose: z.number().int().min(0).max(4),
  coordinationCompose: z.number().int().min(0).max(4),
  scenariosCompose: z.number().int().min(0).max(4),
  memoryCompose: z.number().int().min(0).max(4),
  dataIntelligenceCompose: z.number().int().min(0).max(4),
  commandCompose: z.number().int().min(0).max(4),
  situationRoomSynthesis: z.number().int().min(0).max(4),
});
export type IndustrialSituationRoomComposePlan = z.infer<typeof IndustrialSituationRoomComposePlanSchema>;

export const IndustrialSituationRoomDiagnosticsSchema = z.object({
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicProjection: z.literal(true),
  nonOperationalExecution: z.literal(true),
  proxySignals: z.literal(true),
  deterministicReadout: z.literal(true),
  sourceMode: z.string(),
  projectionMode: IndustrialSituationRoomProjectionModeSchema,
  payloadWeightClass: z.enum(["compact", "large"]),
  composeCacheHit: z.boolean(),
  cacheStrategy: z.literal("SHORT_TTL_SITUATION_ROOM_CACHE"),
  composeCount: z.number().int().min(0).max(96),
  composePlan: IndustrialSituationRoomComposePlanSchema,
  composeCountMeaning: z.literal("logical_pipeline_steps_not_cpu_cost"),
  costDisclosure: z.string().max(720),
  reusedBundles: z.array(z.string()).max(24),
  sourceBundlesEmbedded: z.boolean(),
  degradedMode: z.boolean(),
  snapshotSource: z.enum(["LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE", "DISABLED", "SEQUENTIAL_SLICE_FALLBACK"]),
  upstreamPropagationColdStarts: z.number().int().min(0).max(4),
  fullProjectionWarning: z.string().max(480).optional(),
});
export type IndustrialSituationRoomDiagnostics = z.infer<typeof IndustrialSituationRoomDiagnosticsSchema>;

export const IndustrialSituationRoomBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: IndustrialSituationRoomPolicySchema,
  disclaimer: z.string(),
  snapshot: IndustrialSituationRoomSnapshotSchema,
  situationCells: z.array(IndustrialSituationCellSchema).max(12),
  operationalMissions: z.array(IndustrialOperationalMissionSchema).max(16),
  criticalDependencies: z.array(IndustrialCriticalDependencySchema).max(20),
  executiveAttention: z.array(IndustrialExecutiveAttentionSchema).max(12),
  briefings: IndustrialSituationBriefingsSchema,
  diagnostics: IndustrialSituationRoomDiagnosticsSchema,
  /** Full projection may attach upstream economic-command bundle for audit — validated at runtime, not deeply re-parsed here (TS inference depth). */
  embeddedEconomicCommand: z.unknown().optional(),
  sourceMode: z.enum(["LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE", "SEQUENTIAL_SLICE_FALLBACK"]).optional(),
  degraded: z.boolean().optional(),
  missingSlices: z.array(z.string()).max(32).optional(),
});
export type IndustrialSituationRoomBundle = z.infer<typeof IndustrialSituationRoomBundleSchema>;

export const IndustrialSituationCellsSliceSchema = z.array(IndustrialSituationCellSchema);
export const IndustrialSituationMissionsSliceSchema = z.array(IndustrialOperationalMissionSchema);
export const IndustrialSituationDependenciesSliceSchema = z.array(IndustrialCriticalDependencySchema);
export const IndustrialSituationAttentionSliceSchema = z.array(IndustrialExecutiveAttentionSchema);
export const IndustrialSituationBriefingsOnlySchema = IndustrialSituationBriefingsSchema;
