import { z } from "zod";

/**
 * Instruction 20.1 — conversational negotiation + order draft (heuristic, private thread).
 * Instruction 20.1A — safety literals + diagnostics (distinct from Prisma `NegotiationStatus`).
 */
export const RelationalNegotiationConversationStateSchema = z.enum([
  "NEGOTIATION_ACTIVE",
  "PROPOSAL_PENDING",
  "PROPOSAL_ACCEPTED",
  "IMPLICIT_ACCEPTANCE",
  "DRAFT_READY",
  "DRAFT_CONFIRMED",
  "DRAFT_REJECTED",
  "RESERVATION_PENDING",
  "RESERVATION_ACCEPTED",
  "RESERVATION_EXPIRED",
]);
export type RelationalNegotiationConversationState = z.infer<typeof RelationalNegotiationConversationStateSchema>;

export const ConversationalConfirmationSignalSchema = z.enum([
  "NONE",
  "STRONG_CONFIRMATION",
  "WEAK_ACKNOWLEDGEMENT",
  "AMBIGUOUS_ACCEPTANCE",
]);
export type ConversationalConfirmationSignal = z.infer<typeof ConversationalConfirmationSignalSchema>;

export const ConversationalWorkingTermsSchema = z.object({
  quantity: z.number().nullable(),
  quantityUnit: z.string().max(32).nullable(),
  unitPrice: z.number().nullable(),
  currency: z.string().max(8).nullable(),
  deliveryHint: z.string().max(160).nullable(),
  frequency: z.string().max(80).nullable(),
  destination: z.string().max(160).nullable(),
});
export type ConversationalWorkingTerms = z.infer<typeof ConversationalWorkingTermsSchema>;

export const ConversationalDraftRevisionSchema = z.object({
  at: z.string(),
  messageId: z.string().uuid().nullable(),
  organizationId: z.string().uuid(),
  kind: z.enum([
    "TEXT_EXTRACTION",
    "EXPLICIT_ACCEPT",
    "IMPLICIT_SILENCE",
    "REJECTION",
    "HUMAN_STRIP_CONFIRM",
    "HUMAN_STRIP_REJECT",
    "RESERVATION_HEURISTIC",
    "STRONG_ACCEPT_SIGNAL",
    "WEAK_ACK_SIGNAL",
  ]),
  summary: z.string().max(400),
  snapshot: ConversationalWorkingTermsSchema.partial().optional(),
});
export type ConversationalDraftRevision = z.infer<typeof ConversationalDraftRevisionSchema>;

export const ConversationalNegotiationStatusMutationSchema = z.enum(["NONE", "METADATA_ONLY", "HARD_ACCEPTED"]);
export type ConversationalNegotiationStatusMutation = z.infer<typeof ConversationalNegotiationStatusMutationSchema>;

export const ReservationIntentSafetyModeSchema = z.enum(["STRICT_SYMBOLIC", "LEGACY_UNTAGGED"]);
export type ReservationIntentSafetyMode = z.infer<typeof ReservationIntentSafetyModeSchema>;

export const ConversationalConversionStatusSchema = z.enum([
  "NONE",
  "PENDING_CONFIRMATION",
  "DRAFT_READY",
  "DRAFT_CONFIRMED",
  "DRAFT_REJECTED",
]);
export type ConversationalConversionStatus = z.infer<typeof ConversationalConversionStatusSchema>;

export const ConversationalOrderDraftEnvelopeSchema = z.object({
  version: z.enum(["1", "2"]),
  negotiationState: RelationalNegotiationConversationStateSchema,
  implicitAcceptanceWindowMinutes: z.number().int().min(5).max(10080).default(120),
  workingTerms: ConversationalWorkingTermsSchema,
  confidenceScore: z.number().min(0).max(1),
  extractionConfidence: z.number().min(0).max(1),
  implicitInterpretationRisk: z.number().min(0).max(1),
  unresolvedFields: z.array(z.string().max(80)).max(24),
  requiresHumanValidation: z.boolean(),
  /** Last commercial numeric proposal anchor (counter-party must accept). */
  lastProposalMessageId: z.string().uuid().nullable(),
  lastProposalOrganizationId: z.string().uuid().nullable(),
  lastProposalAt: z.string().nullable(),
  readinessNote: z
    .enum(["NONE", "PENDING_CONFIRMATION", "DRAFT_READY_FOR_HUMAN_CONFIRM"])
    .default("NONE"),
  revisionHistory: z.array(ConversationalDraftRevisionSchema).max(200),
  advisoryNote: z.string().max(520),
  heuristicOnly: z.literal(true),
  lastSymbolicReservationIntentId: z.string().uuid().nullable().optional(),
  /** Instruction 20.1A — stable envelope id (server-issued). */
  draftId: z.string().uuid(),
  relationshipId: z.string().uuid().nullable(),
  buyerOrganizationId: z.string().uuid().nullable(),
  sellerOrganizationId: z.string().uuid().nullable(),
  createsOrderAutomatically: z.literal(false),
  convertibleToOrder: z.boolean(),
  conversionStatus: ConversationalConversionStatusSchema,
  humanValidationRequired: z.literal(true),
  hardOrderCreationDisabled: z.literal(true),
  negotiationStatusMutation: ConversationalNegotiationStatusMutationSchema,
  reservationIntentSafetyMode: ReservationIntentSafetyModeSchema,
  lastConfirmationSignal: ConversationalConfirmationSignalSchema,
});
export type ConversationalOrderDraftEnvelope = z.infer<typeof ConversationalOrderDraftEnvelopeSchema>;

export const CommerceThreadDraftDiagnosticsSchema = z.object({
  actorResolvedFrom: z.enum(["AUTH_CONTEXT", "DEV_FALLBACK"]),
  bodyActorTrusted: z.literal(false),
  threadMembershipValidated: z.boolean(),
  relationshipValidated: z.boolean(),
  corridorValidated: z.boolean(),
  relationshipValidationSource: z.enum(["RESOLVED_BY_ORG_PAIR", "NONE"]),
  rejectedByRelationshipValidationCount: z.number().int().min(0),
  hardAcceptedStatusWritten: z.boolean(),
  negotiationStatusMutation: ConversationalNegotiationStatusMutationSchema,
});
export type CommerceThreadDraftDiagnostics = z.infer<typeof CommerceThreadDraftDiagnosticsSchema>;

export const ConversationalOrderDraftResponseSchema = z.object({
  threadId: z.string().uuid(),
  negotiationId: z.string().uuid().nullable(),
  productId: z.string().uuid().nullable(),
  draft: ConversationalOrderDraftEnvelopeSchema,
  policy: z.enum(["ACTIVE", "DISABLED"]),
  diagnostics: CommerceThreadDraftDiagnosticsSchema,
});
export type ConversationalOrderDraftResponse = z.infer<typeof ConversationalOrderDraftResponseSchema>;

/** Pure filter — ADV / allocation must exclude symbolic conversational intents. */
export function isSymbolicConversationReservationIntent(ri: {
  source: string;
  metadata?: unknown;
}): boolean {
  if (ri.source === "CONVERSATIONAL_SYMBOLIC_DRAFT") return true;
  const m = ri.metadata as Record<string, unknown> | null | undefined;
  if (!m || typeof m !== "object") return false;
  return Boolean(
    m["symbolic"] === true &&
      m["conversationalHeuristic"] === true &&
      (m["notStockReservation"] === true || m["requiresHumanConfirmation"] === true),
  );
}

export const CommerceNegotiationRealtimeEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("negotiation.updated"),
    threadId: z.string().uuid(),
    negotiationState: RelationalNegotiationConversationStateSchema,
    ts: z.string(),
  }),
  z.object({
    type: z.literal("negotiation.accepted"),
    threadId: z.string().uuid(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("negotiation.rejected"),
    threadId: z.string().uuid(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("draft.human_confirmed"),
    threadId: z.string().uuid(),
    metadataOnly: z.boolean().optional(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("draft.updated"),
    threadId: z.string().uuid(),
    draft: ConversationalOrderDraftEnvelopeSchema,
    ts: z.string(),
  }),
  z.object({
    type: z.literal("draft.ready"),
    threadId: z.string().uuid(),
    draft: ConversationalOrderDraftEnvelopeSchema,
    ts: z.string(),
  }),
  z.object({
    type: z.literal("reservation.created"),
    threadId: z.string().uuid(),
    reservationIntentId: z.string().uuid(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("reservation.expired"),
    threadId: z.string().uuid(),
    reservationIntentId: z.string().uuid(),
    ts: z.string(),
  }),
]);
export type CommerceNegotiationRealtimeEvent = z.infer<typeof CommerceNegotiationRealtimeEventSchema>;
