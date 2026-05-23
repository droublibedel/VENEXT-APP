import { z } from "zod";

const unit = z.number().min(0).max(1);

export const IndustrialOperationalContinuityProjectionModeSchema = z.enum(["summary", "full"]);
export type IndustrialOperationalContinuityProjectionMode = z.infer<
  typeof IndustrialOperationalContinuityProjectionModeSchema
>;

export const IndustrialOperationalContinuityPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type IndustrialOperationalContinuityPolicy = z.infer<typeof IndustrialOperationalContinuityPolicySchema>;

export const OperationalStabilityStateTypeSchema = z.enum([
  "stable_continuity",
  "pressured_continuity",
  "fragile_continuity",
  "unstable_continuity",
  "recovery_transition",
  "overloaded_transition",
]);
export type OperationalStabilityStateType = z.infer<typeof OperationalStabilityStateTypeSchema>;

export const OperationalStabilityStateSchema = z.object({
  stateId: z.string(),
  stateType: OperationalStabilityStateTypeSchema,
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  continuityScore: unit,
  volatility: unit,
  resilience: unit,
  operationalLoad: unit,
  stabilizationCapacity: unit,
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type OperationalStabilityState = z.infer<typeof OperationalStabilityStateSchema>;

export const ContinuityPressureKindSchema = z.enum([
  "supply_continuity_pressure",
  "logistics_continuity_pressure",
  "financial_continuity_pressure",
  "coordination_continuity_pressure",
  "distribution_continuity_pressure",
  "industrial_saturation_pressure",
]);
export type ContinuityPressureKind = z.infer<typeof ContinuityPressureKindSchema>;

export const ContinuityPressureSchema = z.object({
  pressureId: z.string(),
  kind: ContinuityPressureKindSchema,
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  heuristicOnly: z.literal(true),
  intensity: unit,
  exposure: unit,
  affectedPoles: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type ContinuityPressure = z.infer<typeof ContinuityPressureSchema>;

export const CriticalContinuityCorridorKindSchema = z.enum([
  "fragile_operational_corridor",
  "overloaded_corridor",
  "unstable_bridge",
  "continuity_choke_point",
  "systemic_continuity_bottleneck",
]);
export type CriticalContinuityCorridorKind = z.infer<typeof CriticalContinuityCorridorKindSchema>;

export const CriticalContinuityCorridorSchema = z.object({
  corridorId: z.string(),
  kind: CriticalContinuityCorridorKindSchema,
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  loadProxy: unit,
  fragility: unit,
  involvedPoles: z.array(z.string()).max(16),
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type CriticalContinuityCorridor = z.infer<typeof CriticalContinuityCorridorSchema>;

export const OperationalCadenceSignalKindSchema = z.enum([
  "cadence_instability",
  "operational_rhythm_pressure",
  "recovery_latency",
  "systemic_slowdown",
  "overload_accumulation",
]);
export type OperationalCadenceSignalKind = z.infer<typeof OperationalCadenceSignalKindSchema>;

export const OperationalCadenceSignalSchema = z.object({
  cadenceId: z.string(),
  kind: OperationalCadenceSignalKindSchema,
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  intensity: unit,
  sourceSignals: z.array(z.string()).max(32),
  explanation: z.string().max(720),
});
export type OperationalCadenceSignal = z.infer<typeof OperationalCadenceSignalSchema>;

export const IndustrialOperationalContinuityBriefingsSchema = z.object({
  executiveLines: z.array(z.string()).max(8),
  operationalLines: z.array(z.string()).max(8),
  stabilizationLines: z.array(z.string()).max(8),
});
export type IndustrialOperationalContinuityBriefings = z.infer<typeof IndustrialOperationalContinuityBriefingsSchema>;

export const IndustrialOperationalContinuitySnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  continuitySource: z.enum([
    "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
    "DISABLED",
    "DISABLED_UPSTREAM_DEPENDENCY",
  ]),
  situationRoomDigest: z.object({
    bundleGeneratedAt: z.string(),
    situationCellCount: z.number().int().min(0).max(64),
    criticalDependencyCount: z.number().int().min(0).max(64),
    missionCount: z.number().int().min(0).max(64),
    globalStressProxy: unit,
    executivePosture: z.string(),
  }),
  economicCommandDigest: z.object({
    headline: z.string(),
    pressureZoneCount: z.number().int().min(0).max(64),
    globalStress: unit,
  }),
});
export type IndustrialOperationalContinuitySnapshot = z.infer<typeof IndustrialOperationalContinuitySnapshotSchema>;

/** Flat compose plan — echoes upstream ISR/command counters + continuity synthesis (Instruction 18.7). */
export const IndustrialOperationalContinuityComposePlanSchema = z.object({
  situationRoomMaterialization: z.number().int().min(0).max(1),
  continuitySynthesis: z.number().int().min(0).max(1),
  propagationCompose: z.number().int().min(0).max(4),
  coordinationCompose: z.number().int().min(0).max(4),
  scenariosCompose: z.number().int().min(0).max(4),
  memoryCompose: z.number().int().min(0).max(4),
  dataIntelligenceCompose: z.number().int().min(0).max(4),
  commandCompose: z.number().int().min(0).max(4),
  situationRoomSynthesis: z.number().int().min(0).max(4),
});
export type IndustrialOperationalContinuityComposePlan = z.infer<typeof IndustrialOperationalContinuityComposePlanSchema>;

export const IndustrialOperationalContinuityProductRoleSchema = z.literal("CONTINUITY_LENS_ABOVE_SITUATION_ROOM");
export type IndustrialOperationalContinuityProductRole = z.infer<typeof IndustrialOperationalContinuityProductRoleSchema>;

export const IndustrialOperationalContinuityDiagnosticsSchema = z.object({
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicProjection: z.literal(true),
  nonOperationalExecution: z.literal(true),
  proxySignals: z.literal(true),
  deterministicReadout: z.literal(true),
  productRole: IndustrialOperationalContinuityProductRoleSchema,
  relationToSituationRoom: z.string().max(960),
  sourceMode: z.string(),
  projectionMode: IndustrialOperationalContinuityProjectionModeSchema,
  payloadWeightClass: z.enum(["compact", "large"]),
  composeCacheHit: z.boolean(),
  inFlightReuse: z.boolean(),
  cacheStrategy: z.literal("SHORT_TTL_CONTINUITY_CACHE_WITH_SINGLE_FLIGHT"),
  composeCount: z.number().int().min(0).max(128),
  continuityComposePlan: IndustrialOperationalContinuityComposePlanSchema,
  continuityComposeMeaning: z.literal("logical_pipeline_steps_not_cpu_cost"),
  costDisclosure: z.string().max(720),
  reusedBundles: z.array(z.string()).max(24),
  sourceBundlesEmbedded: z.boolean(),
  degradedMode: z.boolean(),
  continuitySource: z.enum([
    "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
    "DISABLED",
    "DISABLED_UPSTREAM_DEPENDENCY",
    "SEQUENTIAL_SLICE_FALLBACK",
  ]),
  upstreamPropagationColdStarts: z.number().int().min(0).max(4),
  fullProjectionWarning: z.string().max(480).optional(),
});
export type IndustrialOperationalContinuityDiagnostics = z.infer<typeof IndustrialOperationalContinuityDiagnosticsSchema>;

export const IndustrialOperationalContinuityBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: IndustrialOperationalContinuityPolicySchema,
  disclaimer: z.string(),
  snapshot: IndustrialOperationalContinuitySnapshotSchema,
  stabilityStates: z.array(OperationalStabilityStateSchema).max(8),
  continuityPressures: z.array(ContinuityPressureSchema).max(12),
  continuityCorridors: z.array(CriticalContinuityCorridorSchema).max(16),
  cadenceSignals: z.array(OperationalCadenceSignalSchema).max(10),
  briefings: IndustrialOperationalContinuityBriefingsSchema,
  diagnostics: IndustrialOperationalContinuityDiagnosticsSchema,
  /** Full projection — upstream situation-room bundle mirror (audit); shallow in Zod to avoid TS7056. */
  embeddedIndustrialSituationRoom: z.unknown().optional(),
  sourceMode: z.enum(["LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE", "SEQUENTIAL_SLICE_FALLBACK"]).optional(),
  degraded: z.boolean().optional(),
  missingSlices: z.array(z.string()).max(32).optional(),
});
export type IndustrialOperationalContinuityBundle = z.infer<typeof IndustrialOperationalContinuityBundleSchema>;

export const OperationalStabilityStatesSliceSchema = z.array(OperationalStabilityStateSchema);
export const ContinuityPressuresSliceSchema = z.array(ContinuityPressureSchema);
export const ContinuityCorridorsSliceSchema = z.array(CriticalContinuityCorridorSchema);
export const CadenceSignalsSliceSchema = z.array(OperationalCadenceSignalSchema);
export const IndustrialOperationalContinuityBriefingsOnlySchema = IndustrialOperationalContinuityBriefingsSchema;
