import { z } from "zod";

/** Instruction 20.5 — Prisma-aligned source labels. */
export const RelationalCartSourceTypeSchema = z.enum([
  "NEGOTIATION_ACCEPTED",
  "CONVERSATIONAL_DRAFT_CONFIRMED",
  "SPONSORED_PRINCIPLE_AGREEMENT",
  "MANUAL_RELATIONAL_ENTRY",
  "RELATIONAL_REORDER",
]);
export type RelationalCartSourceTypeDto = z.infer<typeof RelationalCartSourceTypeSchema>;

export const RelationalCartStatusSchema = z.enum([
  "DRAFT",
  "READY_FOR_REVIEW",
  "CONFIRMED_BY_BUYER",
  "CONFIRMED_BY_SELLER",
  "CONFIRMED_BY_BOTH_PARTIES",
  "LOCKED_FOR_ORDER",
  "CONVERTED_TO_ORDER",
  "REJECTED",
  "EXPIRED",
]);
export type RelationalCartStatusDto = z.infer<typeof RelationalCartStatusSchema>;

export const RelationalCartLineValidationStatusSchema = z.enum([
  "VALIDATED",
  "PRODUCT_UNAVAILABLE",
  "QUANTITY_REQUIRES_REVIEW",
  "CATALOG_VISIBILITY_REQUIRES_REVIEW",
  "SYMBOLIC_STOCK_ONLY",
  "REJECTED",
]);
export type RelationalCartLineValidationStatusDto = z.infer<typeof RelationalCartLineValidationStatusSchema>;

/** READY = legacy negotiation path; CONNECTED = wired end-to-end (20.6 manual catalog). */
export const RelationalCartSourceReadinessSchema = z.enum(["READY", "NOT_CONNECTED_YET", "CONNECTED"]);
export type RelationalCartSourceReadinessDto = z.infer<typeof RelationalCartSourceReadinessSchema>;

/** Instruction 20.6 — POST relational-cart/from-catalog (corridor-scoped, no public checkout). */
export const DirectCatalogCartRequestSchema = z
  .object({
    relationshipId: z.string().uuid(),
    sellerOrganizationId: z.string().uuid(),
    buyerOrganizationId: z.string().uuid(),
    productId: z.string().uuid(),
    catalogId: z.string().uuid().optional().nullable(),
    quantity: z.number().positive().finite(),
    unit: z.string().min(1).max(120),
    actorNote: z.string().max(2000).optional().nullable(),
  })
  .strict();
export type DirectCatalogCartRequestDto = z.infer<typeof DirectCatalogCartRequestSchema>;

export const RelationalCartDiagnosticsSchema = z
  .object({
    relationshipScoped: z.literal(true),
    publicMarketplaceDisabled: z.literal(true),
    checkoutPublicDisabled: z.literal(true),
    paymentExecutionDisabled: z.literal(true),
    stockReservationDisabled: z.literal(true),
    walletDebitDisabled: z.literal(true),
    corridorGovernanceRequired: z.literal(true),
    corridorGovernanceValidated: z.boolean(),
    corridorStateAtCreation: z.string().optional(),
    corridorOperationalWarnings: z.array(z.string()).max(32).optional(),
    corridorPolicySource: z.string().max(240).optional(),
    catalogVisibilityValidated: z.boolean().optional(),
    productOwnershipValidated: z.boolean().optional(),
    symbolicStockOnly: z.boolean().optional(),
    stockNotReserved: z.literal(true).optional(),
    priceNotFinalPayment: z.literal(true).optional(),
    sponsoredPrincipleAgreement: z.boolean().optional(),
    relationshipStillRequired: z.boolean().optional(),
    cartConvertibleToOrder: z.boolean().optional(),
    conversionBlockedReason: z.string().max(120).optional(),
    heuristicOnly: z.literal(true).optional(),
    /** Instruction 20.5A — backoffice RESTRICTED corridor override (never body-spoofed for participants). */
    backofficeOverrideRequested: z.boolean().optional(),
    backofficeOverrideGranted: z.boolean().optional(),
    backofficeOverrideSource: z.enum(["none", "backoffice_actor", "internal_token", "dev_bypass"]).optional(),
    /** Instruction 20.5A — conversational draft cart: relationship derived from thread / negotiation. */
    relationshipResolvedFromThread: z.boolean().optional(),
    clientRelationshipIdIgnored: z.boolean().optional(),
    threadRelationshipValidated: z.boolean().optional(),
    conversionBlockedByLineValidation: z.boolean().optional(),
    /** Instruction 20.5A — which materialization sources are wired end-to-end. */
    sourceTypeReadiness: z.record(z.string(), RelationalCartSourceReadinessSchema).optional(),
    conversionIdempotentReplay: z.boolean().optional(),
    legacyOrderIdReturned: z.boolean().optional(),
    requiresCartConversionStep: z.boolean().optional(),
    /** Instruction 20.6 — direct relational catalog → cart path. */
    directCatalogEntry: z.literal(true).optional(),
    directCatalogCorridorValidated: z.boolean().optional(),
    quantityValidated: z.boolean().optional(),
    quantityRequiresReview: z.boolean().optional(),
    minimumOrderQuantityApplied: z.boolean().optional(),
    packSizeWarning: z.boolean().optional(),
    quantityBusinessRuleNotConfigured: z.boolean().optional(),
    /** Instruction 20.7 — dual confirmation & lock readiness (not payment). */
    buyerConfirmed: z.boolean().optional(),
    sellerConfirmed: z.boolean().optional(),
    bothPartiesConfirmed: z.boolean().optional(),
    lockEligible: z.boolean().optional(),
    conversionEligible: z.boolean().optional(),
    confirmationsResetBecauseCartChanged: z.boolean().optional(),
    reviewStatus: z.string().max(80).optional(),
  });
export type RelationalCartDiagnosticsDto = z.infer<typeof RelationalCartDiagnosticsSchema>;

export const RelationalCartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  catalogId: z.string().uuid().nullable(),
  quantity: z.string(),
  unit: z.string().max(120),
  symbolicStockStatus: z.string().max(80),
  sourceMessageId: z.string().uuid().nullable().optional(),
  sourceNegotiationId: z.string().uuid().nullable().optional(),
  sourceDraftRevisionId: z.string().max(120).nullable().optional(),
  lineValidationStatus: RelationalCartLineValidationStatusSchema,
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RelationalCartItemDto = z.infer<typeof RelationalCartItemSchema>;

export const RelationalCartSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  buyerOrganizationId: z.string().uuid(),
  sellerOrganizationId: z.string().uuid(),
  relationshipId: z.string().uuid(),
  negotiationId: z.string().uuid().nullable(),
  threadId: z.string().uuid().nullable(),
  sourceType: RelationalCartSourceTypeSchema,
  status: RelationalCartStatusSchema,
  corridorStateAtCreation: z.string(),
  corridorGovernanceValidated: z.boolean(),
  corridorOperationalWarnings: z.array(z.string()).max(32),
  corridorPolicySource: z.string(),
  commercialTrustBand: z.string().nullable().optional(),
  requiresBuyerSellerConfirmation: z.boolean(),
  conversionBlockedReason: z.string().nullable().optional(),
  cartConvertibleToOrder: z.boolean(),
  createdByUserId: z.string().uuid(),
  expiresAt: z.string().nullable().optional(),
  convertedOrderId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()),
  buyerConfirmedAt: z.string().nullable(),
  sellerConfirmedAt: z.string().nullable(),
  buyerConfirmedByUserId: z.string().uuid().nullable(),
  sellerConfirmedByUserId: z.string().uuid().nullable(),
  lockedAt: z.string().nullable(),
  lockedByUserId: z.string().uuid().nullable(),
  rejectedAt: z.string().nullable(),
  rejectedByUserId: z.string().uuid().nullable(),
  rejectionReason: z.string().max(4000).nullable().optional(),
  confirmationDiagnostics: z.record(z.unknown()),
  lockDiagnostics: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(RelationalCartItemSchema).max(200),
});
export type RelationalCartDto = z.infer<typeof RelationalCartSchema>;

export const RelationalCartResponseSchema = z.object({
  cart: RelationalCartSchema,
  diagnostics: RelationalCartDiagnosticsSchema,
});
export type RelationalCartResponseDto = z.infer<typeof RelationalCartResponseSchema>;

export const RelationalCartConversionResponseSchema = z.object({
  orderId: z.string().uuid(),
  cartId: z.string().uuid(),
  conversionIdempotentReplay: z.boolean().optional(),
  diagnostics: RelationalCartDiagnosticsSchema,
});
export type RelationalCartConversionResponseDto = z.infer<typeof RelationalCartConversionResponseSchema>;

/** Instruction 20.5 — gateway-safe relational cart realtime (no prices, no messages, no PSP). */
export const RelationalCartRealtimeSchema = z
  .object({
    cartId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    status: RelationalCartStatusSchema,
    sourceType: RelationalCartSourceTypeSchema,
    changedFields: z.array(z.string()).max(24),
    corridorGovernanceValidated: z.boolean(),
    paymentExecutionDisabled: z.literal(true),
    computedAt: z.string(),
    relationshipScoped: z.literal(true),
    publicMarketplaceDisabled: z.literal(true),
    checkoutPublicDisabled: z.literal(true),
    stockReservationDisabled: z.literal(true),
    corridorGovernanceRequired: z.literal(true),
    heuristicOnly: z.literal(true).optional(),
    /** Instruction 20.6 — optional for relational.cart.catalog_item_added (no prices). */
    productId: z.string().uuid().optional(),
    /** Instruction 20.7 — corridor confirmation state (minimal). */
    buyerConfirmed: z.boolean().optional(),
    sellerConfirmed: z.boolean().optional(),
    bothPartiesConfirmed: z.boolean().optional(),
    lockEligible: z.boolean().optional(),
    conversionEligible: z.boolean().optional(),
  })
  .strict();
export type RelationalCartRealtimeDto = z.infer<typeof RelationalCartRealtimeSchema>;

/** Instruction 20.5A — allow-list for internal domain fan-in (unknown `relational.cart.*` rejected). */
export const RELATIONAL_CART_REALTIME_EVENT_TYPES = [
  "relational.cart.created",
  "relational.cart.updated",
  "relational.cart.ready_for_review",
  "relational.cart.reviewed",
  "relational.cart.buyer_confirmed",
  "relational.cart.seller_confirmed",
  "relational.cart.both_parties_confirmed",
  "relational.cart.locked",
  "relational.cart.locked_for_order",
  "relational.cart.confirmations_reset",
  "relational.cart.expired",
  "relational.cart.rejected",
  "relational.cart.converted_to_order",
  "relational.cart.catalog_item_added",
] as const;
export type RelationalCartRealtimeEventType = (typeof RELATIONAL_CART_REALTIME_EVENT_TYPES)[number];

export function isRelationalCartRealtimeEventType(eventType: string): eventType is RelationalCartRealtimeEventType {
  return (RELATIONAL_CART_REALTIME_EVENT_TYPES as readonly string[]).includes(eventType);
}
