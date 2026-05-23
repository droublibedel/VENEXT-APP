import { z } from "zod";

export const RelationalOperationalRecommendationSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalOperationalRecommendationSeverityDto = z.infer<
  typeof RelationalOperationalRecommendationSeveritySchema
>;

export const RelationalOperationalRecommendationTypeSchema = z.enum([
  "SLA_DEGRADATION_RECOMMENDATION",
  "INCIDENT_ESCALATION_RECOMMENDATION",
  "DOCUMENT_VALIDATION_RECOMMENDATION",
  "EXECUTION_STABILIZATION_RECOMMENDATION",
  "FULFILLMENT_RISK_RECOMMENDATION",
  "COORDINATION_OVERLOAD_RECOMMENDATION",
  "CORRIDOR_GOVERNANCE_RECOMMENDATION",
  "COLLAPSE_PREVENTION_RECOMMENDATION",
  "OPERATIONAL_REVIEW_RECOMMENDATION",
  "PARTNER_VALIDATION_RECOMMENDATION",
]);
export type RelationalOperationalRecommendationTypeDto = z.infer<
  typeof RelationalOperationalRecommendationTypeSchema
>;

export const RelationalOperationalRecommendationStatusSchema = z.enum([
  "ACTIVE",
  "ACKNOWLEDGED",
  "DISMISSED",
  "RESOLVED",
  "EXPIRED",
]);
export type RelationalOperationalRecommendationStatusDto = z.infer<
  typeof RelationalOperationalRecommendationStatusSchema
>;

export const RelationalOperationalRecommendationSourceSchema = z.enum([
  "SLA_ANALYSIS",
  "PREDICTIVE_RISK",
  "FULFILLMENT_ANALYSIS",
  "INCIDENT_ANALYSIS",
  "EXECUTION_ANALYSIS",
  "COORDINATION_ANALYSIS",
  "GOVERNANCE_ANALYSIS",
  "CORRIDOR_COLLAPSE_ANALYSIS",
]);
export type RelationalOperationalRecommendationSourceDto = z.infer<
  typeof RelationalOperationalRecommendationSourceSchema
>;

export const RelationalOperationalRecommendationSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    recommendationType: RelationalOperationalRecommendationTypeSchema,
    severity: RelationalOperationalRecommendationSeveritySchema,
    source: RelationalOperationalRecommendationSourceSchema,
    status: RelationalOperationalRecommendationStatusSchema,
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    recommendationCode: z.string().min(1).max(120),
    recommendationScore: z.number().int().min(0).max(100),
    confidenceLevel: z.number().int().min(0).max(100),
    actionable: z.boolean(),
    acknowledgedAt: z.string().nullable(),
    resolvedAt: z.string().nullable(),
    dismissedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalOperationalRecommendationDto = z.infer<typeof RelationalOperationalRecommendationSchema>;

export const RelationalOperationalRecommendationListSchema = z
  .object({
    recommendations: z.array(RelationalOperationalRecommendationSchema).max(200),
  })
  .strict();

export type RelationalOperationalRecommendationListDto = z.infer<
  typeof RelationalOperationalRecommendationListSchema
>;

export const RelationalOperationalRecommendationOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    activeCount: z.number().int().nonnegative(),
    criticalCount: z.number().int().nonnegative(),
    highPriorityCount: z.number().int().nonnegative(),
    topRecommendationCode: z.string().nullable(),
    averageScore: z.number().finite().nonnegative(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalRecommendationOverviewDto = z.infer<
  typeof RelationalOperationalRecommendationOverviewSchema
>;

export const RelationalOperationalRecommendationAcknowledgeRequestSchema = z
  .object({
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const RelationalOperationalRecommendationDismissRequestSchema = z
  .object({
    reason: z.string().min(1).max(2000),
  })
  .strict();

export const RelationalOperationalRecommendationResolveRequestSchema = z
  .object({
    resolutionNotes: z.string().min(1).max(4000),
  })
  .strict();

export const RelationalOperationalRecommendationActionResponseSchema = z
  .object({
    recommendation: RelationalOperationalRecommendationSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalRecommendationActionResponseDto = z.infer<
  typeof RelationalOperationalRecommendationActionResponseSchema
>;

export const RelationalOperationalRecommendationRealtimeSchema = z
  .object({
    recommendationId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    severity: RelationalOperationalRecommendationSeveritySchema,
    recommendationType: RelationalOperationalRecommendationTypeSchema,
    recommendationScore: z.number().int().min(0).max(100),
    source: RelationalOperationalRecommendationSourceSchema,
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOperationalRecommendationRealtimeDto = z.infer<
  typeof RelationalOperationalRecommendationRealtimeSchema
>;

export const RELATIONAL_OPERATIONAL_RECOMMENDATION_REALTIME_EVENT_TYPES = [
  "relational.operational.recommendation_created",
  "relational.operational.recommendation_acknowledged",
  "relational.operational.recommendation_resolved",
  "relational.operational.recommendation_dismissed",
  "relational.operational.corridor_collapse_warning",
  "relational.operational.operational_drift_detected",
] as const;

export type RelationalOperationalRecommendationRealtimeEventType =
  (typeof RELATIONAL_OPERATIONAL_RECOMMENDATION_REALTIME_EVENT_TYPES)[number];

export function isRelationalOperationalRecommendationRealtimeEventType(
  eventType: string,
): eventType is RelationalOperationalRecommendationRealtimeEventType {
  return (RELATIONAL_OPERATIONAL_RECOMMENDATION_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
