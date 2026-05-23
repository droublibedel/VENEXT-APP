import { z } from "zod";

const unit = z.number().min(0).max(1);

export const CommercialTrustLevelSchema = z.enum([
  "UNKNOWN",
  "EMERGING",
  "STABLE",
  "STRATEGIC",
  "HIGH_CONFIDENCE",
  "DEGRADED",
  "RESTRICTED",
]);

export const CommercialTrustSignalTypeSchema = z.enum([
  "NEGOTIATION_STABILITY",
  "RELATIONSHIP_RELIABILITY",
  "SPONSORED_DISCOVERY_CONVERSION",
  "COMMERCIAL_RESPONSIVENESS",
  "HIGH_NEGOTIATION_DROP_RATE",
  "DORMANT_CORRIDOR",
  "SYMBOLIC_RESERVATION_MISMATCH",
  "COMMERCIAL_ALIGNMENT_SIGNAL",
  "ORDER_FULFILLMENT_CONSISTENCY",
  "RELATIONSHIP_REJECTION_PATTERN",
]);

export const CommercialTrustDataConfidenceSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const CommercialTrustDirectionSchema = z.enum(["OUTBOUND", "INBOUND", "BILATERAL"]);

/** Instruction 20.3A — NONE removed: anonymous reads are denied at API layer, not exposed as a scope. */
export const CommercialTrustVisibilityScopeSchema = z.enum([
  "SELF_PRIVATE",
  "ACCEPTED_PARTNER_LIMITED",
  "SPONSORED_TEMPORARY_MINIMAL",
  "BACKOFFICE_FULL",
]);

export const CommercialTrustProfileSchema = z.object({
  organizationId: z.string().uuid(),
  trustLevel: CommercialTrustLevelSchema,
  /** Instruction 20.3A — bounded internal indicator (not a public marketplace score). */
  trustScore: z.number().min(0).max(100),
  relationshipCount: z.number().int().nonnegative(),
  acceptedRelationshipCount: z.number().int().nonnegative(),
  negotiationCompletionRate: unit,
  averageNegotiationResponseMinutes: z.number().nonnegative().nullable(),
  sponsoredConversationConversionRate: unit,
  dormantRelationshipRatio: unit,
  unresolvedNegotiationRatio: unit,
  symbolicReservationReliability: unit,
  deliveryConsistencySignal: unit,
  commercialStabilitySignal: unit,
  dataConfidenceLevel: CommercialTrustDataConfidenceSchema,
  lastComputedAt: z.string().datetime().nullable(),
  heuristicOnly: z.literal(true),
});

export const CommercialTrustSignalSchema = z.object({
  signalType: CommercialTrustSignalTypeSchema,
  signalStrength: unit,
  heuristicOnly: z.literal(true),
  confidenceLevel: CommercialTrustDataConfidenceSchema,
  explanation: z.string().max(4000),
  metadata: z.record(z.string(), z.unknown()),
  computedAt: z.union([z.string().datetime(), z.date()]),
});

export const CommercialTrustRelationshipSnapshotSchema = z.object({
  negotiationCount: z.number().int().nonnegative(),
  successfulNegotiationCount: z.number().int().nonnegative(),
  sponsoredDiscoveryOrigin: z.boolean(),
  trustDirection: CommercialTrustDirectionSchema,
  lastInteractionAt: z.string().datetime().nullable(),
  heuristicOnly: z.literal(true),
});

export const CommercialTrustDiagnosticsSchema = z.object({
  heuristicOnly: z.literal(true),
  publicMarketplaceExposure: z.literal(false),
  publicRankingDisabled: z.literal(true),
  socialScoringDisabled: z.literal(true),
  privateEconomicTrustLayer: z.literal(true),
  visibilityScope: CommercialTrustVisibilityScopeSchema,
  confidenceLevel: CommercialTrustDataConfidenceSchema,
  dataCompleteness: unit,
  computationSource: z.literal("COMMERCIAL_TRUST_V1_HEURISTIC"),
  computationMode: z.literal("PER_ORGANIZATION"),
  incrementalReady: z.boolean(),
  lastComputedAt: z.string().datetime().nullable(),
  trustProfileCompleteness: unit,
  heuristicCoverage: unit,
  lowConfidenceAreas: z.array(z.string()),
  unresolvedSignals: z.array(z.string()),
  economicInterpretationReady: z.boolean(),
  dataConfidenceLevel: CommercialTrustDataConfidenceSchema,
  /** Instruction 20.3A — auth / visibility enforcement transparency. */
  actorRequired: z.literal(true),
  anonymousAccessAllowed: z.literal(false),
  visibilityEnforcedAt: z.literal("GUARD_AND_SERVICE"),
});

export const CommercialTrustProfileResponseSchema = z.object({
  profile: CommercialTrustProfileSchema,
  signals: z.array(CommercialTrustSignalSchema),
  visibility: z.object({
    visibilityScope: CommercialTrustVisibilityScopeSchema,
    exposedToPartnerCorridor: z.boolean(),
    sponsorTemporaryVisibility: z.boolean(),
    publicMarketplaceExposure: z.literal(false),
  }),
  diagnostics: CommercialTrustDiagnosticsSchema,
  /** Instruction 20.3A — coarse band for partner-limited views (optional). */
  trustCorridorBand: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  commercialTrustRedaction: z.enum(["NONE", "PARTNER_LIMITED", "SPONSORED_TEMPORARY_MINIMAL"]).optional(),
  sponsoredMinimalDisclaimer: z.string().max(2000).optional(),
});

export const CommercialTrustRelationshipResponseSchema = z.object({
  relationshipId: z.string().uuid(),
  relationshipStatus: z.string(),
  relationshipSource: z.string(),
  viewerOrganizationId: z.string().uuid(),
  peerOrganizationId: z.string().uuid(),
  snapshot: CommercialTrustRelationshipSnapshotSchema.nullable(),
  visibility: z.object({
    visibilityScope: CommercialTrustVisibilityScopeSchema,
    exposedToPartnerCorridor: z.boolean(),
    sponsorTemporaryVisibility: z.boolean(),
    publicMarketplaceExposure: z.literal(false),
  }),
  diagnostics: CommercialTrustDiagnosticsSchema,
});

export type CommercialTrustProfileDto = z.infer<typeof CommercialTrustProfileSchema>;
export type CommercialTrustDiagnosticsDto = z.infer<typeof CommercialTrustDiagnosticsSchema>;
export type CommercialTrustProfileResponseDto = z.infer<typeof CommercialTrustProfileResponseSchema>;
export type CommercialTrustRelationshipResponseDto = z.infer<typeof CommercialTrustRelationshipResponseSchema>;
