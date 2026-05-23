import { z } from "zod";

export const RelationalStrategicMemoryStatusSchema = z.enum([
  "ACTIVE",
  "ARCHIVED",
  "SUPERSEDED",
  "INVALIDATED",
  "EXPIRED",
]);
export type RelationalStrategicMemoryStatusDto = z.infer<typeof RelationalStrategicMemoryStatusSchema>;

export const RelationalStrategicMemoryTypeSchema = z.enum([
  "OPERATIONAL_PATTERN",
  "SLA_RECOVERY",
  "INCIDENT_RESOLUTION",
  "COLLAPSE_PREVENTION",
  "GOVERNANCE_ACTION",
  "EXECUTION_RECOVERY",
  "FULFILLMENT_STRATEGY",
  "PARTNER_BEHAVIOR_PATTERN",
  "COORDINATION_RECOVERY",
  "HUMAN_DECISION_PATTERN",
]);
export type RelationalStrategicMemoryTypeDto = z.infer<typeof RelationalStrategicMemoryTypeSchema>;

export const RelationalStrategicMemorySeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalStrategicMemorySeverityDto = z.infer<typeof RelationalStrategicMemorySeveritySchema>;

export const RelationalStrategicMemoryEventTypeSchema = z.enum([
  "MEMORY_CREATED",
  "MEMORY_REUSED",
  "MEMORY_ARCHIVED",
  "MEMORY_INVALIDATED",
  "MEMORY_PATTERN_DETECTED",
  "MEMORY_OUTCOME_ASSESSED",
]);
export type RelationalStrategicMemoryEventTypeDto = z.infer<typeof RelationalStrategicMemoryEventTypeSchema>;

export const RelationalStrategicMemoryEventSchema = z
  .object({
    id: z.string().uuid(),
    memoryId: z.string().uuid(),
    eventType: RelationalStrategicMemoryEventTypeSchema,
    actorOrganizationId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export type RelationalStrategicMemoryEventDto = z.infer<typeof RelationalStrategicMemoryEventSchema>;

export const RelationalStrategicMemorySchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    memoryStatus: RelationalStrategicMemoryStatusSchema,
    memoryType: RelationalStrategicMemoryTypeSchema,
    memorySeverity: RelationalStrategicMemorySeveritySchema,
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    memoryCode: z.string().min(1).max(120),
    sourceSimulationId: z.string().uuid().nullable(),
    sourceRecommendationId: z.string().uuid().nullable(),
    sourceOrchestrationId: z.string().uuid().nullable(),
    sourceReviewBoardId: z.string().uuid().nullable(),
    sourceIncidentId: z.string().uuid().nullable(),
    sourceFulfillmentId: z.string().uuid().nullable(),
    strategicSummary: z.string().min(1).max(4000),
    observedPattern: z.string().min(1).max(4000),
    recoveryStrategy: z.string().max(4000).nullable(),
    outcomeAssessment: z.string().max(4000).nullable(),
    reuseRecommendation: z.string().max(4000).nullable(),
    confidenceLevel: z.number().int().min(0).max(100),
    reuseCount: z.number().int().nonnegative(),
    successfulReuseCount: z.number().int().nonnegative(),
    failedReuseCount: z.number().int().nonnegative(),
    lastReusedAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    events: z.array(RelationalStrategicMemoryEventSchema).max(100),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalStrategicMemoryDto = z.infer<typeof RelationalStrategicMemorySchema>;

export const RelationalStrategicMemoryListSchema = z
  .object({
    memories: z.array(RelationalStrategicMemorySchema).max(100),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalStrategicMemoryListDto = z.infer<typeof RelationalStrategicMemoryListSchema>;

export const RelationalStrategicMemoryOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    activeCount: z.number().int().nonnegative(),
    archivedCount: z.number().int().nonnegative(),
    invalidatedCount: z.number().int().nonnegative(),
    criticalActiveCount: z.number().int().nonnegative(),
    averageConfidence: z.number().finite().min(0).max(100),
    topPatternType: RelationalStrategicMemoryTypeSchema.nullable(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalStrategicMemoryOverviewDto = z.infer<typeof RelationalStrategicMemoryOverviewSchema>;

export const RelationalStrategicMemoryArchiveRequestSchema = z
  .object({ archiveReason: z.string().min(1).max(4000) })
  .strict();

export const RelationalStrategicMemoryInvalidateRequestSchema = z
  .object({ invalidationReason: z.string().min(1).max(4000) })
  .strict();

export const RelationalStrategicMemoryReuseRequestSchema = z
  .object({
    reuseContext: z.string().min(1).max(4000),
    targetOrchestrationId: z.string().uuid().optional(),
    targetSimulationId: z.string().uuid().optional(),
  })
  .strict();

export const RelationalStrategicMemoryAssessOutcomeRequestSchema = z
  .object({
    outcomeSuccessful: z.boolean(),
    outcomeNotes: z.string().max(4000).optional(),
  })
  .strict();

export const RelationalStrategicMemoryActionResponseSchema = z
  .object({
    memory: RelationalStrategicMemorySchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalStrategicMemoryActionResponseDto = z.infer<
  typeof RelationalStrategicMemoryActionResponseSchema
>;

export const RelationalStrategicMemoryRealtimeSchema = z
  .object({
    memoryId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    memoryType: RelationalStrategicMemoryTypeSchema,
    memorySeverity: RelationalStrategicMemorySeveritySchema,
    confidenceLevel: z.number().int().min(0).max(100),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalStrategicMemoryRealtimeDto = z.infer<typeof RelationalStrategicMemoryRealtimeSchema>;

export const RELATIONAL_STRATEGIC_MEMORY_REALTIME_EVENT_TYPES = [
  "relational.memory.created",
  "relational.memory.memory_archived",
  "relational.memory.memory_invalidated",
  "relational.memory.memory_reused",
  "relational.memory.memory_pattern_detected",
] as const;

export type RelationalStrategicMemoryRealtimeEventType =
  (typeof RELATIONAL_STRATEGIC_MEMORY_REALTIME_EVENT_TYPES)[number];

export function isRelationalStrategicMemoryRealtimeEventType(
  eventType: string,
): eventType is RelationalStrategicMemoryRealtimeEventType {
  return (RELATIONAL_STRATEGIC_MEMORY_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
