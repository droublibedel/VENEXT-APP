import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalExecutiveControlRoomSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveControlRoomStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalExecutiveControlRoomTypeSchema = z.enum([
  "CONTROL_ROOM_OVERVIEW",
  "EXECUTIVE_SUPERVISION",
  "SYSTEMIC_BOARD",
  "NETWORK_OVERSIGHT",
]);
export const RelationalExecutiveControlRoomPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveControlRoomSignalTypeSchema = z.enum([
  "CONTROL",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "BALANCE",
]);
export const RelationalExecutiveControlRoomBoardTypeSchema = z.enum([
  "EXECUTIVE_DECISION_BOARD",
  "STRATEGIC_COMMAND_BOARD",
  "SYSTEMIC_PRESSURE_BOARD",
  "TERRITORIAL_SUPERVISION_BOARD",
  "SECTOR_SUPERVISION_BOARD",
  "RESILIENCE_SUPERVISION_BOARD",
  "EXECUTIVE_BALANCE_BOARD",
]);

export const RelationalExecutiveControlRoomDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    boardCount: z.number().int().min(0).max(64),
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
    controlRoomType: RelationalExecutiveControlRoomTypeSchema,
    boardPriority: RelationalExecutiveControlRoomPrioritySchema,
    controlRoomStatus: RelationalExecutiveControlRoomStatusSchema,
    severity: RelationalExecutiveControlRoomSeveritySchema,
    controlRoomScore: z.number().int().min(0).max(100),
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
    operationsPressure: z.number().int().min(0).max(100),
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
    signalType: RelationalExecutiveControlRoomSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const reportingBoardWireSchema = z
  .object({
    id: z.string().uuid(),
    boardCode: z.string().min(1).max(240),
    boardType: RelationalExecutiveControlRoomBoardTypeSchema,
    severity: RelationalExecutiveControlRoomSeveritySchema,
    priority: RelationalExecutiveControlRoomPrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveControlRoomOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: commandNodeWireSchema,
    signals: z.array(reportingSignalWireSchema).max(24),
    boards: z.array(reportingBoardWireSchema).max(32),
    overviewDiagnostics: RelationalExecutiveControlRoomDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveControlRoomSignalSchema = reportingSignalWireSchema;
export const RelationalExecutiveControlRoomBoardSchema = reportingBoardWireSchema;

export const RelationalExecutiveControlRoomSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    controlRoomStatus: RelationalExecutiveControlRoomStatusSchema,
    controlRoomScore: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveControlRoomDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalBoardCount: z.number().int().min(0).max(10000),
    meanCommandScore: z.number().int().min(0).max(100),
    meanExecutiveConcentration: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveControlRoomActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_EXECUTIVE_CONTROL_ROOM_REALTIME_TYPES = [
  "relational.executive_control_room.board_generated",
  "relational.executive_control_room.executive_pressure_detected",
  "relational.executive_control_room.systemic_concentration_detected",
  "relational.executive_control_room.priority_detected",
  "relational.executive_control_room.resilience_detected",
] as const;

export type RelationalExecutiveControlRoomRealtimeEventType =
  (typeof RELATIONAL_EXECUTIVE_CONTROL_ROOM_REALTIME_TYPES)[number];

export function isRelationalExecutiveControlRoomRealtimeEventType(
  v: string,
): v is RelationalExecutiveControlRoomRealtimeEventType {
  return (RELATIONAL_EXECUTIVE_CONTROL_ROOM_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalExecutiveControlRoomRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    controlRoomNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    controlRoomDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const ExecutiveControlRoomOverviewSchema = RelationalExecutiveControlRoomOverviewSchema;
export const ExecutiveControlRoomSignalSchema = RelationalExecutiveControlRoomSignalSchema;
export const ExecutiveControlRoomBoardSchema = RelationalExecutiveControlRoomBoardSchema;
export const ExecutiveControlRoomSnapshotSchema = RelationalExecutiveControlRoomSnapshotSchema;
export const ExecutiveControlRoomDashboardSchema = RelationalExecutiveControlRoomDashboardSchema;
export const ExecutiveControlRoomRealtimeSchema = RelationalExecutiveControlRoomRealtimeSchema;
export const ExecutiveControlRoomDiagnosticsSchema = RelationalExecutiveControlRoomDiagnosticsSchema;

export type RelationalExecutiveControlRoomOverviewDto = z.infer<
  typeof RelationalExecutiveControlRoomOverviewSchema
>;
export type RelationalExecutiveControlRoomRealtimeDto = z.infer<
  typeof RelationalExecutiveControlRoomRealtimeSchema
>;
