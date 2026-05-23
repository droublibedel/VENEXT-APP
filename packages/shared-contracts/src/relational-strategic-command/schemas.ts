import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalStrategicCommandSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalStrategicCommandStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalStrategicCommandTypeSchema = z.enum([
  "COMMAND_OVERVIEW",
  "EXECUTIVE_SUPERVISION",
  "SYSTEMIC_GRID",
  "NETWORK_OVERSIGHT",
]);
export const RelationalStrategicCommandPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalStrategicCommandSignalTypeSchema = z.enum([
  "COMMAND",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "BALANCE",
]);
export const RelationalStrategicCommandGridTypeSchema = z.enum([
  "EXECUTIVE_COMMAND_GRID",
  "STRATEGIC_SUPERVISION_GRID",
  "SYSTEMIC_PRESSURE_GRID",
  "TERRITORIAL_GRID",
  "SECTOR_GRID",
  "RESILIENCE_GRID",
  "GOVERNANCE_GRID",
]);

export const RelationalStrategicCommandDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    gridCount: z.number().int().min(0).max(64),
    systemicPressureDetected: z.boolean(),
    executiveConcentrationDetected: z.boolean(),
    strategicPriorityDetected: z.boolean(),
  })
  .strict();

const commandNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    commandType: RelationalStrategicCommandTypeSchema,
    commandPriority: RelationalStrategicCommandPrioritySchema,
    commandStatus: RelationalStrategicCommandStatusSchema,
    severity: RelationalStrategicCommandSeveritySchema,
    commandScore: z.number().int().min(0).max(100),
    executiveConcentration: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    strategicBalanceScore: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    monitoringPressure: z.number().int().min(0).max(100),
    orchestrationPressure: z.number().int().min(0).max(100),
    institutionalPressure: z.number().int().min(0).max(100),
    intelligencePressure: z.number().int().min(0).max(100),
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
    signalType: RelationalStrategicCommandSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const reportingGridWireSchema = z
  .object({
    id: z.string().uuid(),
    gridCode: z.string().min(1).max(240),
    gridType: RelationalStrategicCommandGridTypeSchema,
    severity: RelationalStrategicCommandSeveritySchema,
    priority: RelationalStrategicCommandPrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicCommandOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: commandNodeWireSchema,
    signals: z.array(reportingSignalWireSchema).max(24),
    grids: z.array(reportingGridWireSchema).max(32),
    overviewDiagnostics: RelationalStrategicCommandDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicCommandSignalSchema = reportingSignalWireSchema;
export const RelationalStrategicCommandGridSchema = reportingGridWireSchema;

export const RelationalStrategicCommandSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    commandStatus: RelationalStrategicCommandStatusSchema,
    commandScore: z.number().int().min(0).max(100),
    executiveConcentration: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicCommandDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalGridCount: z.number().int().min(0).max(10000),
    meanCommandScore: z.number().int().min(0).max(100),
    meanExecutiveConcentration: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicCommandActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_STRATEGIC_COMMAND_REALTIME_TYPES = [
  "relational.strategic_command.grid_generated",
  "relational.strategic_command.systemic_pressure_detected",
  "relational.strategic_command.executive_concentration_detected",
  "relational.strategic_command.priority_detected",
  "relational.strategic_command.resilience_detected",
] as const;

export type RelationalStrategicCommandRealtimeEventType =
  (typeof RELATIONAL_STRATEGIC_COMMAND_REALTIME_TYPES)[number];

export function isRelationalStrategicCommandRealtimeEventType(
  v: string,
): v is RelationalStrategicCommandRealtimeEventType {
  return (RELATIONAL_STRATEGIC_COMMAND_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalStrategicCommandRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    commandNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    commandDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const StrategicCommandOverviewSchema = RelationalStrategicCommandOverviewSchema;
export const StrategicCommandSignalSchema = RelationalStrategicCommandSignalSchema;
export const StrategicCommandGridSchema = RelationalStrategicCommandGridSchema;
export const StrategicCommandSnapshotSchema = RelationalStrategicCommandSnapshotSchema;
export const StrategicCommandDashboardSchema = RelationalStrategicCommandDashboardSchema;
export const StrategicCommandRealtimeSchema = RelationalStrategicCommandRealtimeSchema;
export const StrategicCommandDiagnosticsSchema = RelationalStrategicCommandDiagnosticsSchema;

export type RelationalStrategicCommandOverviewDto = z.infer<
  typeof RelationalStrategicCommandOverviewSchema
>;
export type RelationalStrategicCommandRealtimeDto = z.infer<
  typeof RelationalStrategicCommandRealtimeSchema
>;
