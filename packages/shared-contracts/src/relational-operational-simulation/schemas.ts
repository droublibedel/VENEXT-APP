import { z } from "zod";

export const RelationalOperationalSimulationStatusSchema = z.enum([
  "DRAFT",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);

export const RelationalOperationalSimulationTypeSchema = z.enum([
  "SLA_STRESS_TEST",
  "CORRIDOR_DEGRADATION",
  "INCIDENT_ESCALATION",
  "EXECUTION_SATURATION",
  "FULFILLMENT_DISRUPTION",
  "COORDINATION_OVERLOAD",
  "COLLAPSE_PROPAGATION",
  "GOVERNANCE_BREAKDOWN",
  "PARTNER_FAILURE",
  "MULTI_CORRIDOR_STRESS",
]);

export type RelationalOperationalSimulationTypeDto = z.infer<typeof RelationalOperationalSimulationTypeSchema>;

export const RelationalOperationalSimulationSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RelationalOperationalSimulationOutcomeSchema = z.enum([
  "STABLE",
  "DEGRADED",
  "HIGH_RISK",
  "COLLAPSE_RISK",
  "RECOVERY_POSSIBLE",
  "RECOVERY_UNLIKELY",
]);

export const RelationalOperationalSimulationScenarioSchema = z
  .object({
    id: z.string().uuid(),
    simulationId: z.string().uuid(),
    scenarioCode: z.string().min(1).max(120),
    scenarioTitle: z.string().min(1).max(240),
    scenarioDescription: z.string().min(1).max(4000),
    scenarioOrder: z.number().int().nonnegative(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export const RelationalOperationalSimulationResultSchema = z
  .object({
    id: z.string().uuid(),
    simulationId: z.string().uuid(),
    resultCode: z.string().min(1).max(120),
    resultTitle: z.string().min(1).max(240),
    resultDescription: z.string().min(1).max(4000),
    calculatedRiskScore: z.number().int().min(0).max(100),
    projectedSlaImpact: z.number().finite(),
    projectedOperationalImpact: z.number().finite(),
    projectedCorridorState: z.string().min(1).max(64),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export const RelationalOperationalSimulationSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    simulationType: RelationalOperationalSimulationTypeSchema,
    status: RelationalOperationalSimulationStatusSchema,
    severity: RelationalOperationalSimulationSeveritySchema,
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    simulationCode: z.string().min(1).max(120),
    expectedRiskScore: z.number().int().min(0).max(100),
    resultingRiskScore: z.number().int().min(0).max(100).nullable(),
    outcome: RelationalOperationalSimulationOutcomeSchema.nullable(),
    deterministic: z.literal(true),
    requiresHumanReview: z.boolean(),
    startedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    scenarios: z.array(RelationalOperationalSimulationScenarioSchema).max(30),
    results: z.array(RelationalOperationalSimulationResultSchema).max(30),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalOperationalSimulationDto = z.infer<typeof RelationalOperationalSimulationSchema>;

export const RelationalOperationalSimulationListSchema = z
  .object({
    simulations: z.array(RelationalOperationalSimulationSchema).max(100),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalSimulationListDto = z.infer<typeof RelationalOperationalSimulationListSchema>;

export const RelationalOperationalSimulationOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    completedCount: z.number().int().nonnegative(),
    runningCount: z.number().int().nonnegative(),
    highRiskCount: z.number().int().nonnegative(),
    collapseRiskCount: z.number().int().nonnegative(),
    averageResultingRisk: z.number().finite().nonnegative(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalSimulationOverviewDto = z.infer<
  typeof RelationalOperationalSimulationOverviewSchema
>;

export const RelationalOperationalSimulationRunRequestSchema = z
  .object({
    simulationType: RelationalOperationalSimulationTypeSchema,
    stressMultiplier: z.number().min(1).max(3).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const RelationalOperationalSimulationCancelRequestSchema = z
  .object({ reason: z.string().min(1).max(2000) })
  .strict();

export const RelationalOperationalSimulationReviewRequestSchema = z
  .object({ reviewNotes: z.string().min(1).max(4000) })
  .strict();

export const RelationalOperationalSimulationActionResponseSchema = z
  .object({
    simulation: RelationalOperationalSimulationSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalSimulationActionResponseDto = z.infer<
  typeof RelationalOperationalSimulationActionResponseSchema
>;

export const RelationalOperationalSimulationRealtimeSchema = z
  .object({
    simulationId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    simulationType: RelationalOperationalSimulationTypeSchema,
    severity: RelationalOperationalSimulationSeveritySchema,
    outcome: RelationalOperationalSimulationOutcomeSchema.nullable(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalSimulationRealtimeDto = z.infer<
  typeof RelationalOperationalSimulationRealtimeSchema
>;

export const RELATIONAL_OPERATIONAL_SIMULATION_REALTIME_EVENT_TYPES = [
  "relational.operational.simulation_started",
  "relational.operational.simulation_completed",
  "relational.operational.simulation_failed",
  "relational.operational.simulation_cancelled",
  "relational.operational.simulation_high_risk_detected",
  "relational.operational.simulation_collapse_detected",
] as const;

export type RelationalOperationalSimulationRealtimeEventType =
  (typeof RELATIONAL_OPERATIONAL_SIMULATION_REALTIME_EVENT_TYPES)[number];

export function isRelationalOperationalSimulationRealtimeEventType(
  eventType: string,
): eventType is RelationalOperationalSimulationRealtimeEventType {
  return (RELATIONAL_OPERATIONAL_SIMULATION_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
