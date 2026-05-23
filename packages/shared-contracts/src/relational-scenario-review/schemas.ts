import { z } from "zod";

export const RelationalScenarioReviewStatusSchema = z.enum([
  "PENDING_REVIEW",
  "UNDER_ANALYSIS",
  "APPROVED",
  "REJECTED",
  "PARTIALLY_APPROVED",
  "ARCHIVED",
  "EXPIRED",
]);
export type RelationalScenarioReviewStatusDto = z.infer<typeof RelationalScenarioReviewStatusSchema>;

export const RelationalScenarioDecisionTypeSchema = z.enum([
  "APPROVE_SIMULATION",
  "REJECT_SIMULATION",
  "REQUEST_REEVALUATION",
  "APPROVE_ORCHESTRATION",
  "REJECT_ORCHESTRATION",
  "APPROVE_RECOVERY_PLAN",
  "ESCALATE_CORRIDOR_REVIEW",
  "REQUEST_MANUAL_VALIDATION",
]);
export type RelationalScenarioDecisionTypeDto = z.infer<typeof RelationalScenarioDecisionTypeSchema>;

export const RelationalScenarioDecisionSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalScenarioDecisionSeverityDto = z.infer<typeof RelationalScenarioDecisionSeveritySchema>;

export const RelationalScenarioReviewEventTypeSchema = z.enum([
  "REVIEW_CREATED",
  "REVIEW_APPROVED",
  "REVIEW_REJECTED",
  "REVIEW_ESCALATED",
  "REVIEW_ARCHIVED",
  "EXECUTIVE_VALIDATION_REQUIRED",
]);
export type RelationalScenarioReviewEventTypeDto = z.infer<typeof RelationalScenarioReviewEventTypeSchema>;

export const RelationalScenarioReviewEventSchema = z
  .object({
    id: z.string().uuid(),
    reviewBoardId: z.string().uuid(),
    eventType: RelationalScenarioReviewEventTypeSchema,
    previousStatus: RelationalScenarioReviewStatusSchema.nullable(),
    nextStatus: RelationalScenarioReviewStatusSchema.nullable(),
    actorOrganizationId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export type RelationalScenarioReviewEventDto = z.infer<typeof RelationalScenarioReviewEventSchema>;

export const RelationalScenarioReviewSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    simulationId: z.string().uuid().nullable(),
    orchestrationId: z.string().uuid().nullable(),
    recommendationId: z.string().uuid().nullable(),
    reviewStatus: RelationalScenarioReviewStatusSchema,
    decisionType: RelationalScenarioDecisionTypeSchema,
    decisionSeverity: RelationalScenarioDecisionSeveritySchema,
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    decisionSummary: z.string().max(4000).nullable(),
    requiresExecutiveValidation: z.boolean(),
    requiresDualValidation: z.boolean(),
    reviewedByOrganizationId: z.string().uuid().nullable(),
    reviewedByUserId: z.string().uuid().nullable(),
    approvedAt: z.string().nullable(),
    rejectedAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    events: z.array(RelationalScenarioReviewEventSchema).max(100),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalScenarioReviewDto = z.infer<typeof RelationalScenarioReviewSchema>;

export const RelationalScenarioReviewListSchema = z
  .object({
    reviews: z.array(RelationalScenarioReviewSchema).max(100),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalScenarioReviewListDto = z.infer<typeof RelationalScenarioReviewListSchema>;

export const RelationalScenarioReviewOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    pendingCount: z.number().int().nonnegative(),
    underAnalysisCount: z.number().int().nonnegative(),
    approvedCount: z.number().int().nonnegative(),
    rejectedCount: z.number().int().nonnegative(),
    executiveValidationCount: z.number().int().nonnegative(),
    criticalOpenCount: z.number().int().nonnegative(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalScenarioReviewOverviewDto = z.infer<typeof RelationalScenarioReviewOverviewSchema>;

export const RelationalScenarioReviewApproveRequestSchema = z
  .object({
    decisionSummary: z.string().min(1).max(4000),
    approvalNotes: z.string().max(4000).optional(),
  })
  .strict();

export const RelationalScenarioReviewRejectRequestSchema = z
  .object({
    decisionSummary: z.string().min(1).max(4000),
    rejectionReason: z.string().min(1).max(4000),
  })
  .strict();

export const RelationalScenarioReviewArchiveRequestSchema = z
  .object({ archiveReason: z.string().min(1).max(4000) })
  .strict();

export const RelationalScenarioReviewReevaluateRequestSchema = z
  .object({ reevaluationNotes: z.string().min(1).max(4000) })
  .strict();

export const RelationalScenarioReviewExecutiveValidationRequestSchema = z
  .object({ executiveNotes: z.string().min(1).max(4000) })
  .strict();

export const RelationalScenarioReviewActionResponseSchema = z
  .object({
    review: RelationalScenarioReviewSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalScenarioReviewActionResponseDto = z.infer<typeof RelationalScenarioReviewActionResponseSchema>;

export const RelationalScenarioReviewRealtimeSchema = z
  .object({
    reviewBoardId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    reviewStatus: RelationalScenarioReviewStatusSchema,
    decisionType: RelationalScenarioDecisionTypeSchema,
    decisionSeverity: RelationalScenarioDecisionSeveritySchema,
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalScenarioReviewRealtimeDto = z.infer<typeof RelationalScenarioReviewRealtimeSchema>;

export const RELATIONAL_SCENARIO_REVIEW_REALTIME_EVENT_TYPES = [
  "relational.scenario.review_created",
  "relational.scenario.review_approved",
  "relational.scenario.review_rejected",
  "relational.scenario.review_escalated",
  "relational.scenario.review_archived",
  "relational.scenario.executive_validation_required",
] as const;

export type RelationalScenarioReviewRealtimeEventType =
  (typeof RELATIONAL_SCENARIO_REVIEW_REALTIME_EVENT_TYPES)[number];

export function isRelationalScenarioReviewRealtimeEventType(
  eventType: string,
): eventType is RelationalScenarioReviewRealtimeEventType {
  return (RELATIONAL_SCENARIO_REVIEW_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
