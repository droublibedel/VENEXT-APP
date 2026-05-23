import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalExecutiveOperationsSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveOperationsStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalExecutiveOperationsTypeSchema = z.enum([
  "OPERATIONS_OVERVIEW",
  "EXECUTIVE_SUPERVISION",
  "SYSTEMIC_MATRIX",
  "NETWORK_OVERSIGHT",
]);
export const RelationalExecutiveOperationsPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveOperationsSignalTypeSchema = z.enum([
  "OPERATIONS",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "BALANCE",
]);
export const RelationalExecutiveOperationsMatrixTypeSchema = z.enum([
  "EXECUTIVE_OPERATIONS_MATRIX",
  "STRATEGIC_SUPERVISION_MATRIX",
  "SYSTEMIC_CONCENTRATION_MATRIX",
  "TERRITORIAL_OPERATIONS_MATRIX",
  "SECTOR_OPERATIONS_MATRIX",
  "RESILIENCE_OPERATIONS_MATRIX",
  "EXECUTIVE_BALANCE_MATRIX",
]);

export const RelationalExecutiveOperationsDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    matrixCount: z.number().int().min(0).max(64),
    executivePressureDetected: z.boolean(),
    systemicConcentrationDetected: z.boolean(),
    strategicPriorityDetected: z.boolean(),
  })
  .strict();

const commandNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    operationsType: RelationalExecutiveOperationsTypeSchema,
    operationsPriority: RelationalExecutiveOperationsPrioritySchema,
    operationsStatus: RelationalExecutiveOperationsStatusSchema,
    severity: RelationalExecutiveOperationsSeveritySchema,
    executiveOperationsScore: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    strategicBalanceScore: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    monitoringPressure: z.number().int().min(0).max(100),
    orchestrationPressure: z.number().int().min(0).max(100),
    institutionalPressure: z.number().int().min(0).max(100),
    intelligencePressure: z.number().int().min(0).max(100),
    commandPressure: z.number().int().min(0).max(100),
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

const reportingSignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalExecutiveOperationsSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const reportingMatrixWireSchema = z
  .object({
    id: z.string().uuid(),
    matrixCode: z.string().min(1).max(240),
    matrixType: RelationalExecutiveOperationsMatrixTypeSchema,
    severity: RelationalExecutiveOperationsSeveritySchema,
    priority: RelationalExecutiveOperationsPrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOperationsOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: commandNodeWireSchema,
    signals: z.array(reportingSignalWireSchema).max(24),
    matrices: z.array(reportingMatrixWireSchema).max(32),
    overviewDiagnostics: RelationalExecutiveOperationsDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOperationsSignalSchema = reportingSignalWireSchema;
export const RelationalExecutiveOperationsMatrixSchema = reportingMatrixWireSchema;

export const RelationalExecutiveOperationsSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    operationsStatus: RelationalExecutiveOperationsStatusSchema,
    executiveOperationsScore: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOperationsDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalMatrixCount: z.number().int().min(0).max(10000),
    meanCommandScore: z.number().int().min(0).max(100),
    meanExecutiveConcentration: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOperationsActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_EXECUTIVE_OPERATIONS_REALTIME_TYPES = [
  "relational.executive_operations.matrix_generated",
  "relational.executive_operations.executive_pressure_detected",
  "relational.executive_operations.systemic_concentration_detected",
  "relational.executive_operations.priority_detected",
  "relational.executive_operations.resilience_detected",
] as const;

export type RelationalExecutiveOperationsRealtimeEventType =
  (typeof RELATIONAL_EXECUTIVE_OPERATIONS_REALTIME_TYPES)[number];

export function isRelationalExecutiveOperationsRealtimeEventType(
  v: string,
): v is RelationalExecutiveOperationsRealtimeEventType {
  return (RELATIONAL_EXECUTIVE_OPERATIONS_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalExecutiveOperationsRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    operationsNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    operationsDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const ExecutiveOperationsOverviewSchema = RelationalExecutiveOperationsOverviewSchema;
export const ExecutiveOperationsSignalSchema = RelationalExecutiveOperationsSignalSchema;
export const ExecutiveOperationsMatrixSchema = RelationalExecutiveOperationsMatrixSchema;
export const ExecutiveOperationsSnapshotSchema = RelationalExecutiveOperationsSnapshotSchema;
export const ExecutiveOperationsDashboardSchema = RelationalExecutiveOperationsDashboardSchema;
export const ExecutiveOperationsRealtimeSchema = RelationalExecutiveOperationsRealtimeSchema;
export const ExecutiveOperationsDiagnosticsSchema = RelationalExecutiveOperationsDiagnosticsSchema;

export type RelationalExecutiveOperationsOverviewDto = z.infer<
  typeof RelationalExecutiveOperationsOverviewSchema
>;
export type RelationalExecutiveOperationsRealtimeDto = z.infer<
  typeof RelationalExecutiveOperationsRealtimeSchema
>;
