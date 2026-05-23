import { z } from "zod";

export const RelationalPredictiveRiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalPredictiveRiskLevelDto = z.infer<typeof RelationalPredictiveRiskLevelSchema>;

export const RelationalPredictiveRiskTypeSchema = z.enum([
  "FULFILLMENT_DELAY_PROBABILITY",
  "INCIDENT_ESCALATION_RISK",
  "CORRIDOR_INSTABILITY_RISK",
  "COORDINATION_SATURATION_RISK",
  "EXECUTION_BREAKDOWN_RISK",
  "RECEPTION_REJECTION_RISK",
  "BLOCKING_TASK_ACCUMULATION",
  "OPERATIONAL_DRIFT_DETECTED",
  "SLA_COLLAPSE_RISK",
  "REPEATED_DEGRADATION_PATTERN",
]);
export type RelationalPredictiveRiskTypeDto = z.infer<typeof RelationalPredictiveRiskTypeSchema>;

export const RelationalOperationalDriftTypeSchema = z.enum([
  "EXECUTION_SLOWDOWN",
  "FULFILLMENT_SLOWDOWN",
  "INCIDENT_ACCELERATION",
  "CONFIRMATION_LATENCY_INCREASE",
  "BLOCKING_TASK_GROWTH",
  "CORRIDOR_STABILITY_DECREASE",
]);
export type RelationalOperationalDriftTypeDto = z.infer<typeof RelationalOperationalDriftTypeSchema>;

export const RelationalPredictiveRiskSignalSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    orderId: z.string().uuid().nullable(),
    riskType: RelationalPredictiveRiskTypeSchema,
    riskLevel: RelationalPredictiveRiskLevelSchema,
    driftType: RelationalOperationalDriftTypeSchema.nullable(),
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    signalScore: z.number().finite().min(0).max(100),
    confidenceLevel: z.number().finite().min(0).max(1),
    detectedAt: z.string(),
    resolvedAt: z.string().nullable(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalPredictiveRiskSignalDto = z.infer<typeof RelationalPredictiveRiskSignalSchema>;

export const RelationalOperationalDriftSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    driftType: RelationalOperationalDriftTypeSchema,
    baselineMetric: z.number().finite().nonnegative(),
    currentMetric: z.number().finite().nonnegative(),
    deviationPercentage: z.number().finite(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export type RelationalOperationalDriftSnapshotDto = z.infer<typeof RelationalOperationalDriftSnapshotSchema>;

export const RelationalPredictiveOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    corridorCollapseRisk: z.number().finite().min(0).max(100),
    operationalFragility: z.number().finite().min(0).max(100),
    sustainedOperationalDegradation: z.boolean(),
    openRiskSignals: z.number().int().nonnegative(),
    criticalRiskSignals: z.number().int().nonnegative(),
    activeDriftSnapshots: z.number().int().nonnegative(),
    highestRiskLevel: RelationalPredictiveRiskLevelSchema.nullable(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalPredictiveOverviewDto = z.infer<typeof RelationalPredictiveOverviewSchema>;

export const RelationalPredictiveRiskSignalListResponseSchema = z
  .object({
    signals: z.array(RelationalPredictiveRiskSignalSchema).max(200),
  })
  .strict();

export type RelationalPredictiveRiskSignalListResponseDto = z.infer<
  typeof RelationalPredictiveRiskSignalListResponseSchema
>;

export const RelationalOperationalDriftListResponseSchema = z
  .object({
    snapshots: z.array(RelationalOperationalDriftSnapshotSchema).max(200),
  })
  .strict();

export type RelationalOperationalDriftListResponseDto = z.infer<typeof RelationalOperationalDriftListResponseSchema>;

export const RelationalPredictiveRiskResolveRequestSchema = z
  .object({
    resolutionNotes: z.string().min(1).max(4000),
  })
  .strict();

export const RelationalPredictiveRiskResolveResponseSchema = z
  .object({
    signal: RelationalPredictiveRiskSignalSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalPredictiveRiskResolveResponseDto = z.infer<
  typeof RelationalPredictiveRiskResolveResponseSchema
>;

/** Instruction 20.13 — predictive risk realtime (minimal, no PII). */
export const RelationalPredictiveRealtimeSchema = z
  .object({
    riskSignalId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    riskLevel: RelationalPredictiveRiskLevelSchema,
    riskType: RelationalPredictiveRiskTypeSchema,
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalPredictiveRealtimeDto = z.infer<typeof RelationalPredictiveRealtimeSchema>;

export const RELATIONAL_PREDICTIVE_REALTIME_EVENT_TYPES = [
  "relational.predictive.risk_detected",
  "relational.predictive.risk_resolved",
  "relational.predictive.operational_drift_detected",
  "relational.predictive.sla_collapse_warning",
] as const;

export type RelationalPredictiveRealtimeEventType = (typeof RELATIONAL_PREDICTIVE_REALTIME_EVENT_TYPES)[number];

export function isRelationalPredictiveRealtimeEventType(
  eventType: string,
): eventType is RelationalPredictiveRealtimeEventType {
  return (RELATIONAL_PREDICTIVE_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
