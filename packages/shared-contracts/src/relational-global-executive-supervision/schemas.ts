import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalGlobalExecutiveSupervisionSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalGlobalExecutiveSupervisionStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalGlobalExecutiveSupervisionTypeSchema = z.enum([
  "SUPERVISION_OVERVIEW",
  "GLOBAL_EXECUTIVE_CONSOLIDATION",
  "SYSTEMIC_EXPOSURE",
  "NETWORK_SUPERVISION",
]);
export const RelationalGlobalExecutiveSupervisionPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalGlobalExecutiveSupervisionSignalTypeSchema = z.enum([
  "SUPERVISION",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "BALANCE",
]);
export const RelationalGlobalExecutiveSupervisionMatrixTypeSchema = z.enum([
  "GLOBAL_EXECUTIVE_SUPERVISION_MATRIX",
  "STRATEGIC_NETWORK_MATRIX",
  "SYSTEMIC_PRESSURE_MATRIX",
  "TERRITORIAL_SUPERVISION_MATRIX",
  "SECTOR_SUPERVISION_MATRIX",
  "RESILIENCE_SUPERVISION_MATRIX",
  "EXECUTIVE_BALANCE_MATRIX",
]);

export const RelationalGlobalExecutiveSupervisionDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    matrixCount: z.number().int().min(0).max(64),
    executivePressureDetected: z.boolean(),
    systemicExposureDetected: z.boolean(),
    supervisionPriorityDetected: z.boolean(),
  })
  .strict();

const supervisionNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    supervisionType: RelationalGlobalExecutiveSupervisionTypeSchema,
    supervisionPriority: RelationalGlobalExecutiveSupervisionPrioritySchema,
    supervisionStatus: RelationalGlobalExecutiveSupervisionStatusSchema,
    severity: RelationalGlobalExecutiveSupervisionSeveritySchema,
    supervisionScore: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
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
    synthesisPressure: z.number().int().min(0).max(100),
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

const supervisionSignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalGlobalExecutiveSupervisionSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const supervisionMatrixWireSchema = z
  .object({
    id: z.string().uuid(),
    matrixCode: z.string().min(1).max(240),
    matrixType: RelationalGlobalExecutiveSupervisionMatrixTypeSchema,
    severity: RelationalGlobalExecutiveSupervisionSeveritySchema,
    priority: RelationalGlobalExecutiveSupervisionPrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalGlobalExecutiveSupervisionOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: supervisionNodeWireSchema,
    signals: z.array(supervisionSignalWireSchema).max(24),
    matrices: z.array(supervisionMatrixWireSchema).max(32),
    overviewDiagnostics: RelationalGlobalExecutiveSupervisionDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalGlobalExecutiveSupervisionSignalSchema = supervisionSignalWireSchema;
export const RelationalGlobalExecutiveSupervisionMatrixSchema = supervisionMatrixWireSchema;

export const RelationalGlobalExecutiveSupervisionSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    supervisionStatus: RelationalGlobalExecutiveSupervisionStatusSchema,
    supervisionScore: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalGlobalExecutiveSupervisionDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalMatrixCount: z.number().int().min(0).max(10000),
    meanSupervisionScore: z.number().int().min(0).max(100),
    meanExecutivePressure: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalGlobalExecutiveSupervisionActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_GLOBAL_EXECUTIVE_SUPERVISION_REALTIME_TYPES = [
  "relational.global_executive_supervision.matrix_generated",
  "relational.global_executive_supervision.executive_pressure_detected",
  "relational.global_executive_supervision.systemic_exposure_detected",
  "relational.global_executive_supervision.priority_detected",
  "relational.global_executive_supervision.resilience_detected",
] as const;

export type RelationalGlobalExecutiveSupervisionRealtimeEventType =
  (typeof RELATIONAL_GLOBAL_EXECUTIVE_SUPERVISION_REALTIME_TYPES)[number];

export function isRelationalGlobalExecutiveSupervisionRealtimeEventType(
  v: string,
): v is RelationalGlobalExecutiveSupervisionRealtimeEventType {
  return (RELATIONAL_GLOBAL_EXECUTIVE_SUPERVISION_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalGlobalExecutiveSupervisionRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    globalExecutiveSupervisionNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    supervisionDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const GlobalExecutiveSupervisionOverviewSchema = RelationalGlobalExecutiveSupervisionOverviewSchema;
export const GlobalExecutiveSupervisionSignalSchema = RelationalGlobalExecutiveSupervisionSignalSchema;
export const GlobalExecutiveSupervisionMatrixSchema = RelationalGlobalExecutiveSupervisionMatrixSchema;
export const GlobalExecutiveSupervisionSnapshotSchema = RelationalGlobalExecutiveSupervisionSnapshotSchema;
export const GlobalExecutiveSupervisionDashboardSchema = RelationalGlobalExecutiveSupervisionDashboardSchema;
export const GlobalExecutiveSupervisionRealtimeSchema = RelationalGlobalExecutiveSupervisionRealtimeSchema;
export const GlobalExecutiveSupervisionDiagnosticsSchema = RelationalGlobalExecutiveSupervisionDiagnosticsSchema;

export type RelationalGlobalExecutiveSupervisionOverviewDto = z.infer<
  typeof RelationalGlobalExecutiveSupervisionOverviewSchema
>;
export type RelationalGlobalExecutiveSupervisionRealtimeDto = z.infer<
  typeof RelationalGlobalExecutiveSupervisionRealtimeSchema
>;
