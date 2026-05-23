import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalStrategicObservatorySeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalStrategicObservatoryStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalStrategicObservatoryTypeSchema = z.enum([
  "OBSERVATORY_OVERVIEW",
  "MACRO_COORDINATION",
  "SYSTEMIC_CONCENTRATION",
  "NETWORK_COORDINATION",
]);
export const RelationalStrategicObservatoryPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalStrategicObservatorySignalTypeSchema = z.enum([
  "OBSERVATORY",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "BALANCE",
]);
export const RelationalStrategicObservatoryGridTypeSchema = z.enum([
  "GLOBAL_STRATEGIC_OBSERVATORY_GRID",
  "EXECUTIVE_PRESSURE_GRID",
  "SYSTEMIC_CONCENTRATION_GRID",
  "TERRITORIAL_COORDINATION_GRID",
  "SECTOR_COORDINATION_GRID",
  "RESILIENCE_COORDINATION_GRID",
  "EXECUTIVE_ALIGNMENT_GRID",
]);

export const RelationalStrategicObservatoryDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    gridCount: z.number().int().min(0).max(64),
    executiveExposureDetected: z.boolean(),
    systemicConcentrationDetected: z.boolean(),
    observatoryPriorityDetected: z.boolean(),
  })
  .strict();

const observatoryNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    observatoryType: RelationalStrategicObservatoryTypeSchema,
    observatoryPriority: RelationalStrategicObservatoryPrioritySchema,
    observatoryStatus: RelationalStrategicObservatoryStatusSchema,
    severity: RelationalStrategicObservatorySeveritySchema,
    observatoryScore: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    strategicCoordinationPressure: z.number().int().min(0).max(100),
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

const observatorySignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalStrategicObservatorySignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const observatoryGridWireSchema = z
  .object({
    id: z.string().uuid(),
    gridCode: z.string().min(1).max(240),
    gridType: RelationalStrategicObservatoryGridTypeSchema,
    severity: RelationalStrategicObservatorySeveritySchema,
    priority: RelationalStrategicObservatoryPrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicObservatoryOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: observatoryNodeWireSchema,
    signals: z.array(observatorySignalWireSchema).max(24),
    grids: z.array(observatoryGridWireSchema).max(32),
    overviewDiagnostics: RelationalStrategicObservatoryDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicObservatorySignalSchema = observatorySignalWireSchema;
export const RelationalStrategicObservatoryGridSchema = observatoryGridWireSchema;

export const RelationalStrategicObservatorySnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    observatoryStatus: RelationalStrategicObservatoryStatusSchema,
    observatoryScore: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicObservatoryDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalGridCount: z.number().int().min(0).max(10000),
    meanObservatoryScore: z.number().int().min(0).max(100),
    meanExecutiveExposure: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicObservatoryActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_STRATEGIC_OBSERVATORY_REALTIME_TYPES = [
  "relational.strategic_observatory.grid_generated",
  "relational.strategic_observatory.executive_pressure_detected",
  "relational.strategic_observatory.systemic_concentration_detected",
  "relational.strategic_observatory.priority_detected",
  "relational.strategic_observatory.resilience_detected",
] as const;

export type RelationalStrategicObservatoryRealtimeEventType =
  (typeof RELATIONAL_STRATEGIC_OBSERVATORY_REALTIME_TYPES)[number];

export function isRelationalStrategicObservatoryRealtimeEventType(
  v: string,
): v is RelationalStrategicObservatoryRealtimeEventType {
  return (RELATIONAL_STRATEGIC_OBSERVATORY_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalStrategicObservatoryRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    strategicObservatoryNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    observatoryDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const StrategicObservatoryOverviewSchema = RelationalStrategicObservatoryOverviewSchema;
export const StrategicObservatorySignalSchema = RelationalStrategicObservatorySignalSchema;
export const StrategicObservatoryGridSchema = RelationalStrategicObservatoryGridSchema;
export const StrategicObservatorySnapshotSchema = RelationalStrategicObservatorySnapshotSchema;
export const StrategicObservatoryDashboardSchema = RelationalStrategicObservatoryDashboardSchema;
export const StrategicObservatoryRealtimeSchema = RelationalStrategicObservatoryRealtimeSchema;
export const StrategicObservatoryDiagnosticsSchema = RelationalStrategicObservatoryDiagnosticsSchema;

export type RelationalStrategicObservatoryOverviewDto = z.infer<typeof RelationalStrategicObservatoryOverviewSchema>;
export type RelationalStrategicObservatoryRealtimeDto = z.infer<typeof RelationalStrategicObservatoryRealtimeSchema>;
