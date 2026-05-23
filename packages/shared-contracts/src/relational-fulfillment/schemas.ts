import { z } from "zod";

export const RelationalFulfillmentStatusSchema = z.enum([
  "PREPARING_FULFILLMENT",
  "READY_FOR_LOADING",
  "LOADING_CONFIRMED",
  "IN_TRANSFER",
  "ARRIVED_AT_DESTINATION",
  "RECEPTION_PENDING_VALIDATION",
  "RECEPTION_VALIDATED",
  "RECEPTION_PARTIALLY_VALIDATED",
  "RECEPTION_REJECTED",
  "INCIDENT_REPORTED",
  "FULFILLMENT_COMPLETED",
  "FULFILLMENT_BLOCKED",
]);
export type RelationalFulfillmentStatusDto = z.infer<typeof RelationalFulfillmentStatusSchema>;

export const RelationalFulfillmentProofTypeSchema = z.enum([
  "RECEIPT_PHOTO",
  "RECEIPT_DOCUMENT",
  "RECEIPT_SIGNATURE_SCAN",
  "LOADING_DOCUMENT",
  "DAMAGE_EVIDENCE",
]);
export type RelationalFulfillmentProofTypeDto = z.infer<typeof RelationalFulfillmentProofTypeSchema>;

export const RelationalFulfillmentIncidentTypeSchema = z.enum([
  "DAMAGED_GOODS",
  "PARTIAL_RECEPTION",
  "DOCUMENT_MISMATCH",
  "QUANTITY_MISMATCH",
  "PACKAGING_ISSUE",
  "FULFILLMENT_DELAY",
  "UNAUTHORIZED_SUBSTITUTION",
]);
export type RelationalFulfillmentIncidentTypeDto = z.infer<typeof RelationalFulfillmentIncidentTypeSchema>;

/** Instruction 20.10 — B2B incident resolution lifecycle. */
export const RelationalFulfillmentIncidentResolutionStatusSchema = z.enum([
  "OPEN",
  "RESOLUTION_PROPOSED",
  "ACCEPTED_BY_SELLER",
  "ACCEPTED_BY_BUYER",
  "ACCEPTED_BY_BOTH_PARTIES",
  "RESOLVED",
  "REJECTED",
  "ESCALATION_REQUIRED",
]);
export type RelationalFulfillmentIncidentResolutionStatusDto = z.infer<
  typeof RelationalFulfillmentIncidentResolutionStatusSchema
>;

export const RelationalFulfillmentSchema = z
  .object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    buyerOrganizationId: z.string().uuid(),
    sellerOrganizationId: z.string().uuid(),
    fulfillmentStatus: RelationalFulfillmentStatusSchema,
    proofRequired: z.boolean(),
    proofValidated: z.boolean(),
    receptionValidatedAt: z.string().nullable(),
    receptionValidationNotes: z.string().nullable(),
    loadingConfirmedAt: z.string().nullable(),
    transferStartedAt: z.string().nullable(),
    arrivedAtDestinationAt: z.string().nullable(),
    fulfillmentCompletedAt: z.string().nullable(),
    blockedAt: z.string().nullable(),
    blockedReason: z.string().nullable(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalFulfillmentDto = z.infer<typeof RelationalFulfillmentSchema>;

export const RelationalFulfillmentProofSchema = z
  .object({
    id: z.string().uuid(),
    fulfillmentRecordId: z.string().uuid(),
    proofType: RelationalFulfillmentProofTypeSchema,
    uploadedByOrganizationId: z.string().uuid(),
    uploadedByUserId: z.string().uuid(),
    fileUrl: z.string().min(1).max(2048),
    createdAt: z.string(),
  })
  .strict();

export type RelationalFulfillmentProofDto = z.infer<typeof RelationalFulfillmentProofSchema>;

export const RelationalFulfillmentIncidentSchema = z
  .object({
    id: z.string().uuid(),
    fulfillmentRecordId: z.string().uuid(),
    incidentType: RelationalFulfillmentIncidentTypeSchema,
    reportedByOrganizationId: z.string().uuid(),
    reportedByUserId: z.string().uuid(),
    description: z.string().min(1).max(4000),
    severity: z.string().max(32),
    resolutionStatus: RelationalFulfillmentIncidentResolutionStatusSchema,
    resolutionRequestedAt: z.string().nullable(),
    resolutionProposal: z.string().nullable(),
    sellerResolutionAcceptedAt: z.string().nullable(),
    buyerResolutionAcceptedAt: z.string().nullable(),
    resolvedAt: z.string().nullable(),
    resolutionNotes: z.string().nullable(),
    blocksFulfillmentCompletion: z.boolean(),
    createdAt: z.string(),
  })
  .strict();

export type RelationalFulfillmentIncidentDto = z.infer<typeof RelationalFulfillmentIncidentSchema>;

export const RelationalFulfillmentViewResponseSchema = z
  .object({
    fulfillment: RelationalFulfillmentSchema,
    proofs: z.array(RelationalFulfillmentProofSchema).max(100),
    incidents: z.array(RelationalFulfillmentIncidentSchema).max(100),
  })
  .strict();

export type RelationalFulfillmentViewResponseDto = z.infer<typeof RelationalFulfillmentViewResponseSchema>;

export const RelationalFulfillmentTransitionRequestSchema = z
  .object({
    targetStatus: RelationalFulfillmentStatusSchema,
  })
  .strict();

export type RelationalFulfillmentTransitionRequestDto = z.infer<typeof RelationalFulfillmentTransitionRequestSchema>;

export const RelationalFulfillmentSubmitProofRequestSchema = z
  .object({
    proofType: RelationalFulfillmentProofTypeSchema,
    fileUrl: z.string().min(1).max(2048),
  })
  .strict();

export const RelationalFulfillmentValidateReceptionRequestSchema = z
  .object({
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const RelationalFulfillmentReportIncidentRequestSchema = z
  .object({
    incidentType: RelationalFulfillmentIncidentTypeSchema,
    description: z.string().min(1).max(4000),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  })
  .strict();

/** Instruction 20.10 — buyer rejects corridor reception. */
export const RelationalFulfillmentRejectReceptionRequestSchema = z
  .object({
    reason: z.string().min(1).max(4000),
    incidentType: RelationalFulfillmentIncidentTypeSchema.optional(),
  })
  .strict();

export type RelationalFulfillmentRejectReceptionRequestDto = z.infer<
  typeof RelationalFulfillmentRejectReceptionRequestSchema
>;

/** Instruction 20.10 — buyer partial reception validation. */
export const RelationalFulfillmentPartialReceptionRequestSchema = z
  .object({
    notes: z.string().min(1).max(4000),
    incidentType: z.enum(["PARTIAL_RECEPTION", "QUANTITY_MISMATCH"]),
  })
  .strict();

export type RelationalFulfillmentPartialReceptionRequestDto = z.infer<
  typeof RelationalFulfillmentPartialReceptionRequestSchema
>;

/** Instruction 20.10 — partner proposes operational resolution. */
export const RelationalFulfillmentIncidentResolutionProposalRequestSchema = z
  .object({
    resolutionProposal: z.string().min(1).max(4000),
    resolutionNotes: z.string().max(2000).optional(),
  })
  .strict();

export type RelationalFulfillmentIncidentResolutionProposalRequestDto = z.infer<
  typeof RelationalFulfillmentIncidentResolutionProposalRequestSchema
>;

/** Instruction 20.9A — persisted fulfillment audit journal. */
export const RelationalFulfillmentEventTypeSchema = z.enum([
  "FULFILLMENT_TRANSITIONED",
  "FULFILLMENT_PROOF_SUBMITTED",
  "RECEPTION_VALIDATED",
  "INCIDENT_REPORTED",
  "FULFILLMENT_COMPLETED",
  "FULFILLMENT_BLOCKED",
  "RECEPTION_REJECTED",
  "PARTIAL_RECEPTION_VALIDATED",
  "INCIDENT_RESOLUTION_PROPOSED",
  "INCIDENT_RESOLUTION_ACCEPTED",
  "INCIDENT_RESOLVED",
  "INCIDENT_ESCALATION_REQUIRED",
]);
export type RelationalFulfillmentEventTypeDto = z.infer<typeof RelationalFulfillmentEventTypeSchema>;

export const RelationalFulfillmentEventSchema = z
  .object({
    id: z.string().uuid(),
    fulfillmentRecordId: z.string().uuid(),
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    eventType: RelationalFulfillmentEventTypeSchema,
    previousStatus: RelationalFulfillmentStatusSchema.nullable(),
    nextStatus: RelationalFulfillmentStatusSchema.nullable(),
    actorOrganizationId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    diagnostics: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.string(),
  })
  .strict();

export type RelationalFulfillmentEventDto = z.infer<typeof RelationalFulfillmentEventSchema>;

export const RelationalFulfillmentActionTypeSchema = z.enum([
  "TRANSITION",
  "PROOF_SUBMITTED",
  "RECEPTION_VALIDATED",
  "RECEPTION_REJECTED",
  "PARTIAL_RECEPTION_VALIDATED",
  "INCIDENT_REPORTED",
  "INCIDENT_RESOLUTION_PROPOSED",
  "INCIDENT_RESOLUTION_ACCEPTED",
  "INCIDENT_RESOLVED",
  "FULFILLMENT_COMPLETED",
]);
export type RelationalFulfillmentActionTypeDto = z.infer<typeof RelationalFulfillmentActionTypeSchema>;

/** Instruction 20.9A — POST mutation response (core boundary). */
export const RelationalFulfillmentActionResponseSchema = z
  .object({
    fulfillmentRecordId: z.string().uuid(),
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    previousStatus: RelationalFulfillmentStatusSchema.nullable(),
    nextStatus: RelationalFulfillmentStatusSchema,
    actionType: RelationalFulfillmentActionTypeSchema,
    eventCreated: z.boolean(),
    eventType: RelationalFulfillmentEventTypeSchema.nullable(),
    incidentId: z.string().uuid().optional(),
    resolutionStatus: RelationalFulfillmentIncidentResolutionStatusSchema.optional(),
    diagnostics: z.record(z.unknown()).optional(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalFulfillmentActionResponseDto = z.infer<typeof RelationalFulfillmentActionResponseSchema>;

/** Instruction 20.10 — incident resolution action response. */
export const RelationalFulfillmentIncidentResolutionActionResponseSchema =
  RelationalFulfillmentActionResponseSchema;
export type RelationalFulfillmentIncidentResolutionActionResponseDto =
  RelationalFulfillmentActionResponseDto;

/** Instruction 20.9 — gateway / WS payload (no GPS, wallet, home delivery). */
export const RelationalFulfillmentRealtimeSchema = z
  .object({
    fulfillmentRecordId: z.string().uuid(),
    orderId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    fulfillmentStatus: RelationalFulfillmentStatusSchema,
    incidentId: z.string().uuid().optional(),
    actionType: RelationalFulfillmentActionTypeSchema.optional(),
    eventType: RelationalFulfillmentEventTypeSchema.optional(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalFulfillmentRealtimeDto = z.infer<typeof RelationalFulfillmentRealtimeSchema>;

export const RELATIONAL_FULFILLMENT_REALTIME_EVENT_TYPES = [
  "relational.fulfillment.preparing",
  "relational.fulfillment.loading_ready",
  "relational.fulfillment.loading_confirmed",
  "relational.fulfillment.in_transfer",
  "relational.fulfillment.arrived",
  "relational.fulfillment.reception_pending",
  "relational.fulfillment.validated",
  "relational.fulfillment.partial_validation",
  "relational.fulfillment.rejected",
  "relational.fulfillment.blocked",
  "relational.fulfillment.incident_reported",
  "relational.fulfillment.completed",
  "relational.fulfillment.proof_submitted",
  "relational.fulfillment.reception_validated",
  "relational.fulfillment.reception_rejected",
  "relational.fulfillment.incident_resolution_proposed",
  "relational.fulfillment.incident_resolution_accepted",
  "relational.fulfillment.incident_resolved",
  "relational.fulfillment.incident_escalation_required",
] as const;

export type RelationalFulfillmentRealtimeEventType = (typeof RELATIONAL_FULFILLMENT_REALTIME_EVENT_TYPES)[number];

export function isRelationalFulfillmentRealtimeEventType(
  eventType: string,
): eventType is RelationalFulfillmentRealtimeEventType {
  return (RELATIONAL_FULFILLMENT_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
