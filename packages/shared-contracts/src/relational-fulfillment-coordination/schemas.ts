import { z } from "zod";

export const RelationalFulfillmentTaskStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_EXTERNAL_CONFIRMATION",
  "WAITING_CORRIDOR_VALIDATION",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
]);
export type RelationalFulfillmentTaskStatusDto = z.infer<typeof RelationalFulfillmentTaskStatusSchema>;

export const RelationalFulfillmentTaskPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]);
export type RelationalFulfillmentTaskPriorityDto = z.infer<typeof RelationalFulfillmentTaskPrioritySchema>;

export const RelationalFulfillmentTaskTypeSchema = z.enum([
  "DOCUMENT_REQUEST",
  "PROOF_CORRECTION",
  "QUANTITY_REVIEW",
  "DELIVERY_ALIGNMENT",
  "LOADING_VALIDATION",
  "RECEPTION_COORDINATION",
  "INCIDENT_FOLLOW_UP",
  "RETURN_ALIGNMENT",
  "MANUAL_OPERATION",
  "CORRIDOR_VALIDATION",
  "COMPLIANCE_REVIEW",
]);
export type RelationalFulfillmentTaskTypeDto = z.infer<typeof RelationalFulfillmentTaskTypeSchema>;

export const RelationalFulfillmentTaskEventTypeSchema = z.enum([
  "TASK_CREATED",
  "TASK_ASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_BLOCKED",
  "TASK_COMPLETED",
  "TASK_CANCELLED",
  "TASK_REOPENED",
  "TASK_COMMENT_ADDED",
]);
export type RelationalFulfillmentTaskEventTypeDto = z.infer<typeof RelationalFulfillmentTaskEventTypeSchema>;

export const RelationalFulfillmentTaskSchema = z
  .object({
    id: z.string().uuid(),
    fulfillmentRecordId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    orderId: z.string().uuid(),
    taskType: RelationalFulfillmentTaskTypeSchema,
    taskStatus: RelationalFulfillmentTaskStatusSchema,
    priority: RelationalFulfillmentTaskPrioritySchema,
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    assignedOrganizationId: z.string().uuid().nullable(),
    assignedUserId: z.string().uuid().nullable(),
    createdByOrganizationId: z.string().uuid(),
    createdByUserId: z.string().uuid(),
    blockingFulfillment: z.boolean(),
    requiresBuyerConfirmation: z.boolean(),
    requiresSellerConfirmation: z.boolean(),
    buyerConfirmedAt: z.string().nullable(),
    sellerConfirmedAt: z.string().nullable(),
    dueAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalFulfillmentTaskDto = z.infer<typeof RelationalFulfillmentTaskSchema>;

export const RelationalFulfillmentTaskEventSchema = z
  .object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
    eventType: RelationalFulfillmentTaskEventTypeSchema,
    previousStatus: RelationalFulfillmentTaskStatusSchema.nullable(),
    nextStatus: RelationalFulfillmentTaskStatusSchema.nullable(),
    actorOrganizationId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    comment: z.string().nullable(),
    createdAt: z.string(),
  })
  .strict();

export type RelationalFulfillmentTaskEventDto = z.infer<typeof RelationalFulfillmentTaskEventSchema>;

export const RelationalFulfillmentTaskListResponseSchema = z
  .object({
    tasks: z.array(RelationalFulfillmentTaskSchema).max(200),
  })
  .strict();

export type RelationalFulfillmentTaskListResponseDto = z.infer<typeof RelationalFulfillmentTaskListResponseSchema>;

export const RelationalFulfillmentTaskCreateRequestSchema = z
  .object({
    taskType: RelationalFulfillmentTaskTypeSchema,
    priority: RelationalFulfillmentTaskPrioritySchema.optional(),
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4000),
    assignedOrganizationId: z.string().uuid().optional(),
    assignedUserId: z.string().uuid().optional(),
    blockingFulfillment: z.boolean().optional(),
    requiresBuyerConfirmation: z.boolean().optional(),
    requiresSellerConfirmation: z.boolean().optional(),
    dueAt: z.string().datetime().optional(),
  })
  .strict();

export const RelationalFulfillmentTaskAssignRequestSchema = z
  .object({
    assignedOrganizationId: z.string().uuid(),
    assignedUserId: z.string().uuid().optional(),
  })
  .strict();

export const RelationalFulfillmentTaskCommentRequestSchema = z
  .object({
    comment: z.string().min(1).max(4000),
  })
  .strict();

export const RelationalFulfillmentTaskReopenRequestSchema = z
  .object({
    reason: z.string().min(1).max(2000).optional(),
  })
  .strict();

export const RelationalFulfillmentTaskActionTypeSchema = z.enum([
  "TASK_CREATED",
  "TASK_ASSIGNED",
  "TASK_STARTED",
  "TASK_BLOCKED",
  "TASK_COMPLETED",
  "TASK_CANCELLED",
  "TASK_REOPENED",
  "TASK_COMMENT_ADDED",
]);
export type RelationalFulfillmentTaskActionTypeDto = z.infer<typeof RelationalFulfillmentTaskActionTypeSchema>;

export const RelationalFulfillmentTaskActionResponseSchema = z
  .object({
    taskId: z.string().uuid(),
    fulfillmentRecordId: z.string().uuid(),
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    previousStatus: RelationalFulfillmentTaskStatusSchema.nullable(),
    nextStatus: RelationalFulfillmentTaskStatusSchema,
    actionType: RelationalFulfillmentTaskActionTypeSchema,
    eventCreated: z.boolean(),
    eventType: RelationalFulfillmentTaskEventTypeSchema.nullable(),
    task: RelationalFulfillmentTaskSchema.optional(),
    diagnostics: z.record(z.unknown()).optional(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalFulfillmentTaskActionResponseDto = z.infer<typeof RelationalFulfillmentTaskActionResponseSchema>;

/** Instruction 20.11 — task realtime (no long descriptions, no fileUrl, no GPS). */
export const RelationalFulfillmentTaskRealtimeSchema = z
  .object({
    taskId: z.string().uuid(),
    fulfillmentRecordId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    orderId: z.string().uuid(),
    taskStatus: RelationalFulfillmentTaskStatusSchema,
    taskType: RelationalFulfillmentTaskTypeSchema,
    priority: RelationalFulfillmentTaskPrioritySchema,
    actionType: RelationalFulfillmentTaskActionTypeSchema.optional(),
    eventType: RelationalFulfillmentTaskEventTypeSchema.optional(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalFulfillmentTaskRealtimeDto = z.infer<typeof RelationalFulfillmentTaskRealtimeSchema>;

export const RELATIONAL_FULFILLMENT_TASK_REALTIME_EVENT_TYPES = [
  "relational.fulfillment.task_created",
  "relational.fulfillment.task_assigned",
  "relational.fulfillment.task_started",
  "relational.fulfillment.task_blocked",
  "relational.fulfillment.task_completed",
  "relational.fulfillment.task_cancelled",
  "relational.fulfillment.task_reopened",
  "relational.fulfillment.task_comment_added",
] as const;

export type RelationalFulfillmentTaskRealtimeEventType =
  (typeof RELATIONAL_FULFILLMENT_TASK_REALTIME_EVENT_TYPES)[number];

export function isRelationalFulfillmentTaskRealtimeEventType(
  eventType: string,
): eventType is RelationalFulfillmentTaskRealtimeEventType {
  return (RELATIONAL_FULFILLMENT_TASK_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
