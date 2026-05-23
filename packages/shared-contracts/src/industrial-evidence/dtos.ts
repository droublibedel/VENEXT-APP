import { z } from "zod";

const unit = z.number().min(0).max(1);

export const IndustrialEvidenceProjectionModeSchema = z.enum(["summary", "full"]);
export type IndustrialEvidenceProjectionMode = z.infer<typeof IndustrialEvidenceProjectionModeSchema>;

export const IndustrialEvidenceTypeSchema = z.enum([
  "DOMAIN_EVENT",
  "HEURISTIC_SIGNAL",
  "SYMBOLIC_PROJECTION",
  "SYNTHETIC_DEMO",
  "MEMORY_DERIVED",
  "SCENARIO_DERIVED",
  "PROPAGATION_DERIVED",
  "COORDINATION_DERIVED",
  "COMMAND_DERIVED",
  "SITUATION_ROOM_DERIVED",
  "CONTINUITY_DERIVED",
  "DATA_INTELLIGENCE_DERIVED",
]);
export type IndustrialEvidenceType = z.infer<typeof IndustrialEvidenceTypeSchema>;

export const IndustrialTrustLevelSchema = z.enum([
  "VERIFIED_DOMAIN",
  "STRONG_HEURISTIC",
  "WEAK_HEURISTIC",
  "SYMBOLIC_ONLY",
  "SYNTHETIC_DEMO_ONLY",
  "UNKNOWN_SOURCE",
]);
export type IndustrialTrustLevel = z.infer<typeof IndustrialTrustLevelSchema>;

export const IndustrialEvidenceRecordSchema = z.object({
  evidenceId: z.string(),
  evidenceType: IndustrialEvidenceTypeSchema,
  sourcePole: z.string().max(64),
  sourceBundle: z.string().max(128),
  sourceService: z.string().max(160),
  sourceSignals: z.array(z.string()).max(32),
  derivedFrom: z.array(z.string()).max(24),
  /** Ordinal 0–1 when heuristicConfidence is true — not a calibrated industrial measurement. */
  confidence: unit,
  trustLevel: IndustrialTrustLevelSchema,
  explanation: z.string().max(720),
  limitations: z.string().max(480),
  createdAt: z.string(),
  advisoryOnly: z.literal(true),
  heuristicOnly: z.boolean(),
  symbolicProjection: z.boolean(),
  demoOrSynthetic: z.boolean(),
  heuristicConfidence: z.boolean(),
  confidenceDerivedFrom: z.string().max(200),
  confidenceInputs: z.array(z.string()).max(16),
  confidenceHeuristic: z.string().max(480),
});
export type IndustrialEvidenceRecord = z.infer<typeof IndustrialEvidenceRecordSchema>;

export const IndustrialTrustMatrixEntrySchema = z.object({
  matrixId: z.string(),
  scopeKey: z.string().max(128),
  trustLevel: IndustrialTrustLevelSchema,
  rationale: z.string().max(720),
  evidenceIds: z.array(z.string()).max(48),
  trustReason: z.string().max(480),
  classificationPath: z.array(z.string()).max(24),
  derivedFromFlags: z.record(z.boolean()).refine((m) => Object.keys(m).length <= 16, {
    message: "derivedFromFlags_max_16",
  }),
});
export type IndustrialTrustMatrixEntry = z.infer<typeof IndustrialTrustMatrixEntrySchema>;

export const IndustrialEvidenceTraceNodeSchema = z.object({
  nodeId: z.string(),
  label: z.string().max(240),
  pole: z.string().max(64),
  evidenceType: IndustrialEvidenceTypeSchema,
  derivedFrom: z.array(z.string()).max(16),
  confidence: unit,
});
export type IndustrialEvidenceTraceNode = z.infer<typeof IndustrialEvidenceTraceNodeSchema>;

export const IndustrialEvidenceTraceSchema = z.object({
  traceId: z.string(),
  rootSignal: z.string().max(240),
  traceDepth: z.number().int().min(1).max(16),
  /** Derived correlation alignment — not causal proof. */
  traceKind: z.literal("DERIVED_TRACE_NOT_CAUSAL_PROOF"),
  nodes: z.array(IndustrialEvidenceTraceNodeSchema).max(16),
  confidenceDecay: unit,
  weakestLink: z.string().max(240),
  explanation: z.string().max(960),
  nonCausalTrace: z.literal(true),
  interpretationRisk: z.string().max(480),
  explanatoryBoundary: z.string().max(720),
});
export type IndustrialEvidenceTrace = z.infer<typeof IndustrialEvidenceTraceSchema>;

export const IndustrialLimitationTypeSchema = z.enum([
  "heuristic_limit",
  "symbolic_projection_limit",
  "demo_signal_limit",
  "incomplete_source_limit",
  "proxy_metric_limit",
  "stale_snapshot_limit",
  "non_calibrated_score_limit",
]);
export type IndustrialLimitationType = z.infer<typeof IndustrialLimitationTypeSchema>;

export const IndustrialLimitationRecordSchema = z.object({
  limitationId: z.string(),
  limitationType: IndustrialLimitationTypeSchema,
  affectedSignal: z.string().max(240),
  severity: z.enum(["info", "low", "medium", "high"]),
  explanation: z.string().max(720),
  userFacingWarning: z.string().max(480),
});
export type IndustrialLimitationRecord = z.infer<typeof IndustrialLimitationRecordSchema>;

export const IndustrialEvidenceSourceFreshnessSchema = z.enum([
  "UNKNOWN",
  "FROM_BUNDLE_TIMESTAMP",
  "NOT_INCLUDED",
  "COMPOSE_FAILED",
]);
export const IndustrialEvidenceSourceReliabilitySchema = z.enum([
  "UNKNOWN",
  "UPSTREAM_ROW_OK",
  "UPSTREAM_COMPOSE_FAILED",
  "FLAG_DISABLED",
  "NOT_INCLUDED",
]);
export const IndustrialEvidenceSourceCompletenessSchema = z.enum(["ROW_OK", "ROW_PARTIAL", "ROW_SKIP"]);
export const IndustrialEvidenceSourceAvailabilitySchema = z.enum([
  "AVAILABLE",
  "UNAVAILABLE_FLAG",
  "UNAVAILABLE_COMPOSE",
  "UNAVAILABLE_UNKNOWN",
]);

export const IndustrialEvidenceSourceMapEntrySchema = z.object({
  poleKey: z.string().max(64),
  included: z.boolean(),
  bundleVersion: z.string().max(8).optional(),
  bundleGeneratedAt: z.string().optional(),
  composeHint: z.string().max(320),
  skippedReason: z.string().max(320).optional(),
  sourceFreshness: IndustrialEvidenceSourceFreshnessSchema,
  sourceReliability: IndustrialEvidenceSourceReliabilitySchema,
  sourceCompleteness: IndustrialEvidenceSourceCompletenessSchema,
  sourceAvailability: IndustrialEvidenceSourceAvailabilitySchema,
});
export type IndustrialEvidenceSourceMapEntry = z.infer<typeof IndustrialEvidenceSourceMapEntrySchema>;

export const IndustrialEvidenceComposePlanSchema = z.object({
  economicCommandRead: z.number().int().min(0).max(1),
  economicCoordinationRead: z.number().int().min(0).max(1),
  economicScenariosRead: z.number().int().min(0).max(1),
  economicPropagationRead: z.number().int().min(0).max(1),
  economicMemoryRead: z.number().int().min(0).max(1),
  industrialSituationRoomRead: z.number().int().min(0).max(1),
  industrialOperationalContinuityRead: z.number().int().min(0).max(1),
  dataIntelligenceReferencedViaPropagation: z.number().int().min(0).max(1),
});
export type IndustrialEvidenceComposePlan = z.infer<typeof IndustrialEvidenceComposePlanSchema>;

export const IndustrialEvidenceDiagnosticsSchema = z.object({
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicProjection: z.literal(true),
  nonOperationalExecution: z.literal(true),
  deterministicReadout: z.literal(true),
  sourceMode: z.enum(["LIVE_INDUSTRIAL_EVIDENCE_COMPOSE", "DISABLED", "DISABLED_PARTIAL_UPSTREAM"]),
  projectionMode: IndustrialEvidenceProjectionModeSchema,
  payloadWeightClass: z.enum(["compact", "large"]),
  composeCacheHit: z.boolean(),
  inFlightReuse: z.boolean(),
  cacheStrategy: z.literal("SHORT_TTL_EVIDENCE_CACHE_WITH_SINGLE_FLIGHT"),
  evidenceComposePlan: IndustrialEvidenceComposePlanSchema,
  evidenceComposeMeaning: z.literal("logical_upstream_reads_not_cpu_cost"),
  costDisclosure: z.string().max(960),
  degradedMode: z.boolean(),
  sourceBundlesEmbedded: z.boolean(),
  upstreamFailures: z.array(z.string()).max(24).optional(),
  degradedBundleMode: z.boolean(),
  bundleViewSemantic: z.enum(["FULL_BUNDLE_VIEW", "CACHE_REUSED_BUNDLE_VIEW", "DEGRADED_BUNDLE_VIEW"]),
});
export type IndustrialEvidenceDiagnostics = z.infer<typeof IndustrialEvidenceDiagnosticsSchema>;

export const IndustrialEvidenceScopeSchema = z.object({
  what_is_real: z.string().max(720),
  what_is_heuristic: z.string().max(720),
  what_is_symbolic: z.string().max(720),
  what_is_demo: z.string().max(720),
  what_is_missing: z.string().max(720),
});
export type IndustrialEvidenceScope = z.infer<typeof IndustrialEvidenceScopeSchema>;

export const IndustrialEvidenceSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  headline: z.string().max(480),
  records: z.array(IndustrialEvidenceRecordSchema).max(64),
  trustMatrix: z.array(IndustrialTrustMatrixEntrySchema).max(32),
  traces: z.array(IndustrialEvidenceTraceSchema).max(16),
  limitations: z.array(IndustrialLimitationRecordSchema).max(48),
  sourceMap: z.array(IndustrialEvidenceSourceMapEntrySchema).max(24),
  diagnostics: IndustrialEvidenceDiagnosticsSchema,
  evidenceScope: IndustrialEvidenceScopeSchema,
  interpretationBoundary: z.string().max(960),
  reliabilityBoundary: z.string().max(960),
});
export type IndustrialEvidenceSnapshot = z.infer<typeof IndustrialEvidenceSnapshotSchema>;

export const IndustrialEvidenceBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  disclaimer: z.string(),
  snapshot: IndustrialEvidenceSnapshotSchema,
  /** Full projection — optional mirrors of upstream bundles (audit); shallow in Zod. */
  embeddedSourceBundles: z.record(z.unknown()).optional(),
});
export type IndustrialEvidenceBundle = z.infer<typeof IndustrialEvidenceBundleSchema>;
