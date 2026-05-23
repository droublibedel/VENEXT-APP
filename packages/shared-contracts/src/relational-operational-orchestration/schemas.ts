import { z } from "zod";

export const RelationalOperationalOrchestrationStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "WAITING_VALIDATION",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "EXPIRED",
]);
export type RelationalOperationalOrchestrationStatusDto = z.infer<
  typeof RelationalOperationalOrchestrationStatusSchema
>;

export const RelationalOperationalOrchestrationPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalOperationalOrchestrationPriorityDto = z.infer<
  typeof RelationalOperationalOrchestrationPrioritySchema
>;

export const RelationalOperationalOrchestrationTypeSchema = z.enum([
  "SLA_STABILIZATION",
  "INCIDENT_CONTAINMENT",
  "EXECUTION_RECOVERY",
  "FULFILLMENT_STABILIZATION",
  "CORRIDOR_RECOVERY",
  "COORDINATION_REBALANCING",
  "GOVERNANCE_REVIEW",
  "COLLAPSE_PREVENTION",
  "PARTNER_ALIGNMENT",
  "DOCUMENT_REINFORCEMENT",
]);
export type RelationalOperationalOrchestrationTypeDto = z.infer<typeof RelationalOperationalOrchestrationTypeSchema>;

export const RelationalOperationalOrchestrationStepStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
  "SKIPPED",
  "CANCELLED",
]);
export type RelationalOperationalOrchestrationStepStatusDto = z.infer<
  typeof RelationalOperationalOrchestrationStepStatusSchema
>;

export const RelationalOperationalOrchestrationStepSchema = z
  .object({
    id: z.string().uuid(),
    orchestrationId: z.string().uuid(),
    stepCode: z.string().min(1).max(120),
    stepTitle: z.string().min(1).max(240),
    stepDescription: z.string().min(1).max(4000),
    stepOrder: z.number().int().nonnegative(),
    stepStatus: RelationalOperationalOrchestrationStepStatusSchema,
    blockingStep: z.boolean(),
    assignedOrganizationId: z.string().uuid().nullable(),
    completedAt: z.string().nullable(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalOperationalOrchestrationStepDto = z.infer<typeof RelationalOperationalOrchestrationStepSchema>;

export const RelationalOperationalOrchestrationSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    orchestrationType: RelationalOperationalOrchestrationTypeSchema,
    status: RelationalOperationalOrchestrationStatusSchema,
    priority: RelationalOperationalOrchestrationPrioritySchema,
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    orchestrationCode: z.string().min(1).max(120),
    sourceRecommendationId: z.string().uuid().nullable(),
    riskScore: z.number().int().min(0).max(100),
    confidenceLevel: z.number().int().min(0).max(100),
    requiresHumanValidation: z.boolean(),
    approvedAt: z.string().nullable(),
    startedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    steps: z.array(RelationalOperationalOrchestrationStepSchema).max(50),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalOperationalOrchestrationDto = z.infer<typeof RelationalOperationalOrchestrationSchema>;

export const RelationalOperationalOrchestrationListSchema = z
  .object({
    orchestrations: z.array(RelationalOperationalOrchestrationSchema).max(100),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalOrchestrationListDto = z.infer<typeof RelationalOperationalOrchestrationListSchema>;

export const RelationalOperationalOrchestrationOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    activeCount: z.number().int().nonnegative(),
    waitingValidationCount: z.number().int().nonnegative(),
    criticalCount: z.number().int().nonnegative(),
    completedStepsRatio: z.number().min(0).max(1),
    topOrchestrationCode: z.string().nullable(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalOrchestrationOverviewDto = z.infer<
  typeof RelationalOperationalOrchestrationOverviewSchema
>;

export const RelationalOperationalOrchestrationApproveRequestSchema = z
  .object({ approvalNotes: z.string().max(4000).optional() })
  .strict();

export const RelationalOperationalOrchestrationStartRequestSchema = z
  .object({ startNotes: z.string().max(2000).optional() })
  .strict();

export const RelationalOperationalOrchestrationPauseRequestSchema = z
  .object({ reason: z.string().min(1).max(2000) })
  .strict();

export const RelationalOperationalOrchestrationCancelRequestSchema = z
  .object({ reason: z.string().min(1).max(2000) })
  .strict();

export const RelationalOperationalOrchestrationCompleteStepRequestSchema = z
  .object({ completionNotes: z.string().max(4000).optional() })
  .strict();

export const RelationalOperationalOrchestrationReopenStepRequestSchema = z
  .object({ reason: z.string().min(1).max(2000) })
  .strict();

export const RelationalOperationalOrchestrationActionResponseSchema = z
  .object({
    orchestration: RelationalOperationalOrchestrationSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalOrchestrationActionResponseDto = z.infer<
  typeof RelationalOperationalOrchestrationActionResponseSchema
>;

export const RelationalOperationalOrchestrationRealtimeSchema = z
  .object({
    orchestrationId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    orchestrationType: RelationalOperationalOrchestrationTypeSchema,
    priority: RelationalOperationalOrchestrationPrioritySchema,
    status: RelationalOperationalOrchestrationStatusSchema,
    stepId: z.string().uuid().nullable(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalOrchestrationRealtimeDto = z.infer<
  typeof RelationalOperationalOrchestrationRealtimeSchema
>;

export const RELATIONAL_OPERATIONAL_ORCHESTRATION_REALTIME_EVENT_TYPES = [
  "relational.operational.orchestration_created",
  "relational.operational.orchestration_approved",
  "relational.operational.orchestration_started",
  "relational.operational.orchestration_paused",
  "relational.operational.orchestration_cancelled",
  "relational.operational.orchestration_completed",
  "relational.operational.orchestration_step_completed",
  "relational.operational.orchestration_risk_detected",
] as const;

export type RelationalOperationalOrchestrationRealtimeEventType =
  (typeof RELATIONAL_OPERATIONAL_ORCHESTRATION_REALTIME_EVENT_TYPES)[number];

export function isRelationalOperationalOrchestrationRealtimeEventType(
  eventType: string,
): eventType is RelationalOperationalOrchestrationRealtimeEventType {
  return (RELATIONAL_OPERATIONAL_ORCHESTRATION_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
