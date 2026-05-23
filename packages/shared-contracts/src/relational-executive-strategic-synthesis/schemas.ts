import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalExecutiveStrategicSynthesisSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveStrategicSynthesisStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalExecutiveStrategicSynthesisTypeSchema = z.enum([
  "SYNTHESIS_OVERVIEW",
  "EXECUTIVE_CONSOLIDATION",
  "SYSTEMIC_PRESSURE",
  "NETWORK_OVERSIGHT",
]);
export const RelationalExecutiveStrategicSynthesisPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveStrategicSynthesisSignalTypeSchema = z.enum([
  "SYNTHESIS",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "BALANCE",
]);
export const RelationalExecutiveStrategicSynthesisDigestTypeSchema = z.enum([
  "EXECUTIVE_SYNTHESIS_DIGEST",
  "STRATEGIC_ALIGNMENT_DIGEST",
  "SYSTEMIC_PRESSURE_DIGEST",
  "TERRITORIAL_OVERSIGHT_DIGEST",
  "SECTOR_OVERSIGHT_DIGEST",
  "RESILIENCE_SYNTHESIS_DIGEST",
  "EXECUTIVE_BALANCE_DIGEST",
]);

export const RelationalExecutiveStrategicSynthesisDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    digestCount: z.number().int().min(0).max(64),
    executiveExposureDetected: z.boolean(),
    systemicPressureDetected: z.boolean(),
    strategicPriorityDetected: z.boolean(),
  })
  .strict();

const synthesisNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    synthesisType: RelationalExecutiveStrategicSynthesisTypeSchema,
    synthesisPriority: RelationalExecutiveStrategicSynthesisPrioritySchema,
    synthesisStatus: RelationalExecutiveStrategicSynthesisStatusSchema,
    severity: RelationalExecutiveStrategicSynthesisSeveritySchema,
    synthesisScore: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    strategicAlignmentScore: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    monitoringPressure: z.number().int().min(0).max(100),
    orchestrationPressure: z.number().int().min(0).max(100),
    institutionalPressure: z.number().int().min(0).max(100),
    intelligencePressure: z.number().int().min(0).max(100),
    commandPressure: z.number().int().min(0).max(100),
    operationsPressure: z.number().int().min(0).max(100),
    controlRoomPressure: z.number().int().min(0).max(100),
    recoveryPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
    executiveUrgency: z.number().int().min(0).max(100),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const synthesisSignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalExecutiveStrategicSynthesisSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const synthesisDigestWireSchema = z
  .object({
    id: z.string().uuid(),
    digestCode: z.string().min(1).max(240),
    digestType: RelationalExecutiveStrategicSynthesisDigestTypeSchema,
    severity: RelationalExecutiveStrategicSynthesisSeveritySchema,
    priority: RelationalExecutiveStrategicSynthesisPrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveStrategicSynthesisOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: synthesisNodeWireSchema,
    signals: z.array(synthesisSignalWireSchema).max(24),
    digests: z.array(synthesisDigestWireSchema).max(32),
    overviewDiagnostics: RelationalExecutiveStrategicSynthesisDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveStrategicSynthesisSignalSchema = synthesisSignalWireSchema;
export const RelationalExecutiveStrategicSynthesisDigestSchema = synthesisDigestWireSchema;

export const RelationalExecutiveStrategicSynthesisSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    synthesisStatus: RelationalExecutiveStrategicSynthesisStatusSchema,
    synthesisScore: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveStrategicSynthesisDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalDigestCount: z.number().int().min(0).max(10000),
    meanSynthesisScore: z.number().int().min(0).max(100),
    meanExecutiveExposure: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveStrategicSynthesisActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_EXECUTIVE_STRATEGIC_SYNTHESIS_REALTIME_TYPES = [
  "relational.executive_strategic_synthesis.digest_generated",
  "relational.executive_strategic_synthesis.executive_exposure_detected",
  "relational.executive_strategic_synthesis.systemic_pressure_detected",
  "relational.executive_strategic_synthesis.priority_detected",
  "relational.executive_strategic_synthesis.resilience_detected",
] as const;

export type RelationalExecutiveStrategicSynthesisRealtimeEventType =
  (typeof RELATIONAL_EXECUTIVE_STRATEGIC_SYNTHESIS_REALTIME_TYPES)[number];

export function isRelationalExecutiveStrategicSynthesisRealtimeEventType(
  v: string,
): v is RelationalExecutiveStrategicSynthesisRealtimeEventType {
  return (RELATIONAL_EXECUTIVE_STRATEGIC_SYNTHESIS_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalExecutiveStrategicSynthesisRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    strategicSynthesisNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    synthesisDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const ExecutiveStrategicSynthesisOverviewSchema = RelationalExecutiveStrategicSynthesisOverviewSchema;
export const ExecutiveStrategicSynthesisSignalSchema = RelationalExecutiveStrategicSynthesisSignalSchema;
export const ExecutiveStrategicSynthesisDigestSchema = RelationalExecutiveStrategicSynthesisDigestSchema;
export const ExecutiveStrategicSynthesisSnapshotSchema = RelationalExecutiveStrategicSynthesisSnapshotSchema;
export const ExecutiveStrategicSynthesisDashboardSchema = RelationalExecutiveStrategicSynthesisDashboardSchema;
export const ExecutiveStrategicSynthesisRealtimeSchema = RelationalExecutiveStrategicSynthesisRealtimeSchema;
export const ExecutiveStrategicSynthesisDiagnosticsSchema = RelationalExecutiveStrategicSynthesisDiagnosticsSchema;

export type RelationalExecutiveStrategicSynthesisOverviewDto = z.infer<
  typeof RelationalExecutiveStrategicSynthesisOverviewSchema
>;
export type RelationalExecutiveStrategicSynthesisRealtimeDto = z.infer<
  typeof RelationalExecutiveStrategicSynthesisRealtimeSchema
>;
