import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalEconomicMonitoringSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicMonitoringStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalEconomicMonitoringTypeSchema = z.enum([
  "EXECUTIVE_SUPERVISION",
  "SYSTEMIC_OVERSIGHT",
  "CRITICAL_CORRIDOR_WATCH",
  "STRATEGIC_BALANCE",
]);
export const RelationalEconomicMonitoringPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicMonitoringSignalTypeSchema = z.enum([
  "EXECUTIVE",
  "SYSTEMIC",
  "COORDINATION",
  "RESILIENCE",
  "PRESSURE",
]);
export const RelationalEconomicMonitoringAlertTypeSchema = z.enum([
  "EXECUTIVE_PRESSURE",
  "SYSTEMIC_ESCALATION",
  "CRITICAL_CORRIDOR",
  "STABILIZATION_FAILURE",
  "GOVERNANCE_OVERLOAD",
  "DEPENDENCY_COLLAPSE",
  "TERRITORIAL_IMBALANCE",
  "RECOVERY_DEGRADATION",
]);

export const RelationalEconomicMonitoringDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    alertCount: z.number().int().min(0).max(64),
    strategicImbalanceDetected: z.boolean(),
    systemicEscalationDetected: z.boolean(),
  })
  .strict();

const monitoringNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    monitoringType: RelationalEconomicMonitoringTypeSchema,
    monitoringPriority: RelationalEconomicMonitoringPrioritySchema,
    monitoringStatus: RelationalEconomicMonitoringStatusSchema,
    severity: RelationalEconomicMonitoringSeveritySchema,
    monitoringScore: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    systemicRisk: z.number().int().min(0).max(100),
    resilienceLevel: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
    recoveryPressure: z.number().int().min(0).max(100),
    coordinationPressure: z.number().int().min(0).max(100),
    dependencyPressure: z.number().int().min(0).max(100),
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

const monitoringSignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalEconomicMonitoringSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const monitoringAlertWireSchema = z
  .object({
    id: z.string().uuid(),
    alertCode: z.string().min(1).max(240),
    alertType: RelationalEconomicMonitoringAlertTypeSchema,
    severity: RelationalEconomicMonitoringSeveritySchema,
    priority: RelationalEconomicMonitoringPrioritySchema,
    alertPressure: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicMonitoringOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: monitoringNodeWireSchema,
    signals: z.array(monitoringSignalWireSchema).max(24),
    alerts: z.array(monitoringAlertWireSchema).max(32),
    overviewDiagnostics: RelationalEconomicMonitoringDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicMonitoringSignalSchema = monitoringSignalWireSchema;
export const RelationalEconomicMonitoringAlertSchema = monitoringAlertWireSchema;

export const RelationalEconomicMonitoringSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    monitoringStatus: RelationalEconomicMonitoringStatusSchema,
    monitoringScore: z.number().int().min(0).max(100),
    executivePressure: z.number().int().min(0).max(100),
    systemicRisk: z.number().int().min(0).max(100),
    resilienceLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicMonitoringDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalAlertCount: z.number().int().min(0).max(10000),
    meanMonitoringScore: z.number().int().min(0).max(100),
    meanExecutivePressure: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicMonitoringActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_ECONOMIC_MONITORING_REALTIME_TYPES = [
  "relational.monitoring.executive_alert_detected",
  "relational.monitoring.systemic_risk_detected",
  "relational.monitoring.critical_corridor_detected",
  "relational.monitoring.priority_detected",
  "relational.monitoring.escalation_detected",
] as const;

export type RelationalEconomicMonitoringRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_MONITORING_REALTIME_TYPES)[number];

export function isRelationalEconomicMonitoringRealtimeEventType(
  v: string,
): v is RelationalEconomicMonitoringRealtimeEventType {
  return (RELATIONAL_ECONOMIC_MONITORING_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalEconomicMonitoringRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    monitoringNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    monitoringDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const MonitoringOverviewSchema = RelationalEconomicMonitoringOverviewSchema;
export const MonitoringSignalSchema = RelationalEconomicMonitoringSignalSchema;
export const MonitoringAlertSchema = RelationalEconomicMonitoringAlertSchema;
export const MonitoringSnapshotSchema = RelationalEconomicMonitoringSnapshotSchema;
export const MonitoringDashboardSchema = RelationalEconomicMonitoringDashboardSchema;
export const MonitoringRealtimeSchema = RelationalEconomicMonitoringRealtimeSchema;
export const MonitoringDiagnosticsSchema = RelationalEconomicMonitoringDiagnosticsSchema;

export type RelationalEconomicMonitoringOverviewDto = z.infer<typeof RelationalEconomicMonitoringOverviewSchema>;
export type RelationalEconomicMonitoringRealtimeDto = z.infer<typeof RelationalEconomicMonitoringRealtimeSchema>;
