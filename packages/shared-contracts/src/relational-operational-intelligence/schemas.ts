import { z } from "zod";

export const RelationalOperationalAlertSeveritySchema = z.enum(["INFO", "WARNING", "HIGH", "CRITICAL"]);
export type RelationalOperationalAlertSeverityDto = z.infer<typeof RelationalOperationalAlertSeveritySchema>;

export const RelationalOperationalAlertTypeSchema = z.enum([
  "SLA_DELAY_RISK",
  "REPEATED_INCIDENT_PATTERN",
  "FULFILLMENT_STAGNATION",
  "CORRIDOR_OPERATIONAL_DEGRADATION",
  "UNRESOLVED_BLOCKING_TASKS",
  "REPEATED_RECEPTION_REJECTION",
  "EXECUTION_LATENCY_ANOMALY",
  "PROOF_VALIDATION_DELAY",
  "COORDINATION_OVERLOAD",
  "UNBALANCED_CONFIRMATION_PATTERN",
]);
export type RelationalOperationalAlertTypeDto = z.infer<typeof RelationalOperationalAlertTypeSchema>;

export const RelationalOperationalMetricTypeSchema = z.enum([
  "EXECUTION_DURATION_HOURS",
  "FULFILLMENT_DURATION_HOURS",
  "INCIDENT_RESOLUTION_DURATION_HOURS",
  "TASK_COMPLETION_DURATION_HOURS",
  "BUYER_CONFIRMATION_DELAY_HOURS",
  "SELLER_CONFIRMATION_DELAY_HOURS",
  "RECEPTION_VALIDATION_DELAY_HOURS",
]);
export type RelationalOperationalMetricTypeDto = z.infer<typeof RelationalOperationalMetricTypeSchema>;

export const CorridorOperationalHealthSchema = z.enum(["STABLE", "CAUTION", "DEGRADED", "CRITICAL"]);
export type CorridorOperationalHealthDto = z.infer<typeof CorridorOperationalHealthSchema>;

export const RelationalOperationalAlertSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    orderId: z.string().uuid().nullable(),
    fulfillmentRecordId: z.string().uuid().nullable(),
    alertType: RelationalOperationalAlertTypeSchema,
    severity: RelationalOperationalAlertSeveritySchema,
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    detectedAt: z.string(),
    resolvedAt: z.string().nullable(),
    resolutionNotes: z.string().nullable(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalOperationalAlertDto = z.infer<typeof RelationalOperationalAlertSchema>;

export const RelationalOperationalMetricSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    orderId: z.string().uuid().nullable(),
    metricType: RelationalOperationalMetricTypeSchema,
    metricValue: z.number().finite().nonnegative(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export type RelationalOperationalMetricDto = z.infer<typeof RelationalOperationalMetricSchema>;

export const RelationalOperationalSlaSnapshotSchema = z
  .object({
    relationshipId: z.string().uuid(),
    corridorOperationalHealth: CorridorOperationalHealthSchema,
    corridorState: z.string(),
    activeBlockingTasks: z.number().int().nonnegative(),
    activeIncidentCount: z.number().int().nonnegative(),
    averageFulfillmentDurationHours: z.number().finite().nonnegative().nullable(),
    averageReceptionValidationDelayHours: z.number().finite().nonnegative().nullable(),
    openOperationalAlerts: z.number().int().nonnegative(),
    criticalAlertsCount: z.number().int().nonnegative(),
    coordinationOpenTasks: z.number().int().nonnegative(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalSlaSnapshotDto = z.infer<typeof RelationalOperationalSlaSnapshotSchema>;

export const RelationalOperationalRiskOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    corridorOperationalHealth: CorridorOperationalHealthSchema,
    riskSignals: z.array(
      z
        .object({
          alertType: RelationalOperationalAlertTypeSchema,
          severity: RelationalOperationalAlertSeveritySchema,
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    openAlerts: z.number().int().nonnegative(),
    criticalAlerts: z.number().int().nonnegative(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalRiskOverviewDto = z.infer<typeof RelationalOperationalRiskOverviewSchema>;

export const RelationalOperationalAlertListResponseSchema = z
  .object({
    alerts: z.array(RelationalOperationalAlertSchema).max(200),
  })
  .strict();

export type RelationalOperationalAlertListResponseDto = z.infer<typeof RelationalOperationalAlertListResponseSchema>;

export const RelationalOperationalMetricListResponseSchema = z
  .object({
    metrics: z.array(RelationalOperationalMetricSchema).max(500),
  })
  .strict();

export type RelationalOperationalMetricListResponseDto = z.infer<typeof RelationalOperationalMetricListResponseSchema>;

export const RelationalOperationalAlertResolveRequestSchema = z
  .object({
    resolutionNotes: z.string().min(1).max(4000),
  })
  .strict();

export const RelationalOperationalAlertResolveResponseSchema = z
  .object({
    alert: RelationalOperationalAlertSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalAlertResolveResponseDto = z.infer<
  typeof RelationalOperationalAlertResolveResponseSchema
>;

/** Instruction 20.12 — operational intelligence realtime (minimal, no PII). */
export const RelationalOperationalRealtimeSchema = z
  .object({
    alertId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    severity: RelationalOperationalAlertSeveritySchema,
    alertType: RelationalOperationalAlertTypeSchema,
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalRealtimeDto = z.infer<typeof RelationalOperationalRealtimeSchema>;

export const RELATIONAL_OPERATIONAL_REALTIME_EVENT_TYPES = [
  "relational.operational.alert_created",
  "relational.operational.alert_resolved",
  "relational.operational.sla_degradation_detected",
  "relational.operational.corridor_risk_detected",
] as const;

export type RelationalOperationalRealtimeEventType = (typeof RELATIONAL_OPERATIONAL_REALTIME_EVENT_TYPES)[number];

export function isRelationalOperationalRealtimeEventType(
  eventType: string,
): eventType is RelationalOperationalRealtimeEventType {
  return (RELATIONAL_OPERATIONAL_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
