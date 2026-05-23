import { z } from "zod";

/** Instruction 20.8 — Prisma-aligned execution status (corridor fulfillment core). */
export const RelationalOrderExecutionStatusSchema = z.enum([
  "CREATED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "RECEIVED",
  "COMPLETED",
  "BLOCKED",
  "PARTIALLY_FULFILLED",
  "REJECTED_AT_RECEPTION",
  "CANCELLED",
  "RETURN_REVIEW",
]);
export type RelationalOrderExecutionStatusDto = z.infer<typeof RelationalOrderExecutionStatusSchema>;

export const RelationalOrderExecutionEventTypeSchema = z.enum([
  "PREPARATION_STARTED",
  "PREPARATION_COMPLETED",
  "DISPATCH_CONFIRMED",
  "TRANSIT_STARTED",
  "ARRIVAL_CONFIRMED",
  "RECEPTION_CONFIRMED",
  "EXECUTION_COMPLETED",
  "EXECUTION_BLOCKED",
  "EXECUTION_CANCELLED",
  "PARTIAL_FULFILLMENT_DECLARED",
  "RECEPTION_REJECTED",
  "RETURN_REVIEW_REQUESTED",
]);
export type RelationalOrderExecutionEventTypeDto = z.infer<typeof RelationalOrderExecutionEventTypeSchema>;

/** Instruction 20.8 — API / persistence shape for current execution row projection. */
export const RelationalOrderExecutionSchema = z
  .object({
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    executionStatus: RelationalOrderExecutionStatusSchema,
    buyerOrganizationId: z.string().uuid(),
    sellerOrganizationId: z.string().uuid(),
    lastEventType: RelationalOrderExecutionEventTypeSchema.nullable(),
    lastTransitionAt: z.string().nullable(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalOrderExecutionDto = z.infer<typeof RelationalOrderExecutionSchema>;

export const RelationalOrderExecutionEventSchema = z
  .object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    eventType: RelationalOrderExecutionEventTypeSchema,
    actorOrganizationId: z.string().uuid().nullable(),
    actorUserId: z.string().uuid().nullable(),
    previousStatus: RelationalOrderExecutionStatusSchema.nullable(),
    nextStatus: RelationalOrderExecutionStatusSchema,
    diagnostics: z.unknown().optional(),
    metadata: z.unknown().optional(),
    createdAt: z.string(),
  })
  .strict();

export type RelationalOrderExecutionEventDto = z.infer<typeof RelationalOrderExecutionEventSchema>;

/** Instruction 20.8A — optional corridor-safe completion hints on realtime (no prices, no GPS). */
export const RelationalOrderExecutionRealtimeDiagnosticsSchema = z
  .object({
    completionKind: z.enum(["STANDARD_EXECUTION_COMPLETED", "PARTIAL_FULFILLMENT_COMPLETED"]).optional(),
    fulfilledAsPartial: z.boolean().optional(),
    requiresFulfillmentReview: z.boolean().optional(),
    partialFulfillmentResolved: z.boolean().optional(),
  })
  .strict();

export type RelationalOrderExecutionRealtimeDiagnosticsDto = z.infer<typeof RelationalOrderExecutionRealtimeDiagnosticsSchema>;

/** Instruction 20.8 — gateway fan-in / WS payload (no GPS, no public tracking, no wallet, no prices). */
export const RelationalOrderExecutionRealtimeSchema = z
  .object({
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    executionStatus: RelationalOrderExecutionStatusSchema,
    eventType: RelationalOrderExecutionEventTypeSchema,
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    diagnostics: RelationalOrderExecutionRealtimeDiagnosticsSchema.optional(),
  })
  .strict();

export type RelationalOrderExecutionRealtimeDto = z.infer<typeof RelationalOrderExecutionRealtimeSchema>;

export const RelationalOrderExecutionViewResponseSchema = z
  .object({
    execution: RelationalOrderExecutionSchema,
    events: z.array(RelationalOrderExecutionEventSchema).max(200),
  })
  .strict();

export type RelationalOrderExecutionViewResponseDto = z.infer<typeof RelationalOrderExecutionViewResponseSchema>;

export const RelationalOrderExecutionTransitionRequestSchema = z
  .object({
    targetStatus: RelationalOrderExecutionStatusSchema,
    idempotencyKey: z.string().min(1).max(120).optional(),
  })
  .strict();

export type RelationalOrderExecutionTransitionRequestDto = z.infer<typeof RelationalOrderExecutionTransitionRequestSchema>;

/** Instruction 20.8A — persisted transition diagnostics (governance + fulfillment semantics). */
export const RelationalOrderExecutionTransitionDiagnosticsSchema = z
  .object({
    corridorExecutionGovernanceValidated: z.literal(true),
    corridorStateAtExecution: z.string(),
    corridorExecutionBlockedReason: z.string().max(240).optional(),
    relationshipIdSource: z.literal("ORDER_RELATIONSHIP"),
    relationshipIdConsistencyValidated: z.literal(true),
    orderExecutionAllowed: z.literal(true),
    orderExecutionWarningCodes: z.array(z.string()).max(32),
    governanceWarnings: z.array(z.string()).max(48).optional(),
    executionDelayHours: z.number().optional(),
    completionKind: z.enum(["STANDARD_EXECUTION_COMPLETED", "PARTIAL_FULFILLMENT_COMPLETED"]).optional(),
    fulfilledAsPartial: z.boolean().optional(),
    requiresFulfillmentReview: z.boolean().optional(),
    partialFulfillmentResolved: z.boolean().optional(),
    haltKind: z.enum(["OPERATIONAL_BLOCK", "CANCELLED", "RECEPTION_REJECTION", "RETURN_REVIEW_PATH"]).optional(),
    executionStopReason: z.string().max(200).optional(),
    semanticEventType: z.string().max(64).optional(),
  })
  .strict();

export type RelationalOrderExecutionTransitionDiagnosticsDto = z.infer<typeof RelationalOrderExecutionTransitionDiagnosticsSchema>;

/** Instruction 20.8A — POST transition response (core boundary). */
export const RelationalOrderExecutionTransitionResponseSchema = z
  .object({
    ok: z.literal(true),
    idempotent: z.boolean(),
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    previousStatus: RelationalOrderExecutionStatusSchema,
    nextStatus: RelationalOrderExecutionStatusSchema,
    eventCreated: z.boolean(),
    eventType: RelationalOrderExecutionEventTypeSchema.nullable(),
    diagnostics: RelationalOrderExecutionTransitionDiagnosticsSchema.optional(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    realtimePublishAttempted: z.boolean(),
    realtimePublished: z.boolean(),
  })
  .strict();

export type RelationalOrderExecutionTransitionResponseDto = z.infer<typeof RelationalOrderExecutionTransitionResponseSchema>;

export const RELATIONAL_ORDER_EXECUTION_REALTIME_EVENT_TYPES = [
  "relational.order.preparing",
  "relational.order.ready_for_dispatch",
  "relational.order.dispatched",
  "relational.order.in_transit",
  "relational.order.arrived",
  "relational.order.received",
  "relational.order.completed",
  "relational.order.blocked",
  "relational.order.cancelled",
] as const;

export type RelationalOrderExecutionRealtimeEventType = (typeof RELATIONAL_ORDER_EXECUTION_REALTIME_EVENT_TYPES)[number];

export function isRelationalOrderExecutionRealtimeEventType(
  eventType: string,
): eventType is RelationalOrderExecutionRealtimeEventType {
  return (RELATIONAL_ORDER_EXECUTION_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
