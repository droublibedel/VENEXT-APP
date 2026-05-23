import { z } from "zod";

export const OrderAdvPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type OrderAdvPolicy = z.infer<typeof OrderAdvPolicySchema>;

export const TransactionSignalStripSchema = z.object({
  id: z.string(),
  band: z.string(),
  tension: z.number(),
  vector: z.enum(["compress", "expand", "lateral", "pulse"]),
  label: z.string(),
});
export type TransactionSignalStrip = z.infer<typeof TransactionSignalStripSchema>;

export const OrdersOverviewResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  activeOrders: z.number().int().nonnegative(),
  delayedOrders: z.number().int().nonnegative(),
  negotiationIntensity: z.number().min(0).max(1),
  groupedBuyingActivity: z.number().min(0).max(1),
  reservationPressure: z.number().min(0).max(1),
  deliveryTension: z.number().min(0).max(1),
  retailerDemandAcceleration: z.number().min(0).max(1),
  transactionConfidence: z.number().min(0).max(1),
  conversationalCommerceIntensity: z.number().min(0).max(1),
  signalStrips: z.array(TransactionSignalStripSchema),
  engineNote: z.string().optional(),
});
export type OrdersOverviewResponse = z.infer<typeof OrdersOverviewResponseSchema>;

export const ConversationalStructuredMessageSchema = z.object({
  messageId: z.string().uuid(),
  messageType: z.string(),
  createdAt: z.string(),
  structuredEventSummary: z.string().nullable(),
});
export type ConversationalStructuredMessage = z.infer<typeof ConversationalStructuredMessageSchema>;

export const ConversationalReservationSignalSchema = z.object({
  intentId: z.string().uuid(),
  status: z.string(),
  source: z.string(),
});
export type ConversationalReservationSignal = z.infer<typeof ConversationalReservationSignalSchema>;

export const CommerceCapabilityMarkerSchema = z.object({
  key: z.string(),
  available: z.boolean(),
  reason: z.string().optional(),
});
export type CommerceCapabilityMarker = z.infer<typeof CommerceCapabilityMarkerSchema>;

export const ConversationalThreadRowSchema = z.object({
  threadId: z.string().uuid(),
  threadType: z.string(),
  commerceAnchors: z.array(z.string()),
  lastActivityAt: z.string(),
  tension: z.number().min(0).max(1),
  orderMutationLikelihood: z.number().min(0).max(1).optional(),
  pinnedProductId: z.string().uuid().nullable().optional(),
  negotiationId: z.string().uuid().nullable().optional(),
  orderId: z.string().uuid().nullable().optional(),
  productLinked: z.boolean().optional(),
  negotiationLinked: z.boolean().optional(),
  pinnedProductLabel: z.string().nullable().optional(),
  latestStructuredMessages: z.array(ConversationalStructuredMessageSchema).optional(),
  cartConversionMessageCount: z.number().int().nonnegative().optional(),
  conversationalReservationSignals: z.array(ConversationalReservationSignalSchema).optional(),
});
export type ConversationalThreadRow = z.infer<typeof ConversationalThreadRowSchema>;

export const ConversationalCommerceResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  threads: z.array(ConversationalThreadRowSchema),
  commerceThroughMessagingIndex: z.number().min(0).max(1),
  capabilities: z.array(CommerceCapabilityMarkerSchema).optional(),
  moduleNote: z.string().optional(),
});
export type ConversationalCommerceResponse = z.infer<typeof ConversationalCommerceResponseSchema>;

export const NegotiationIntelligenceRowSchema = z.object({
  negotiationId: z.string().uuid(),
  productId: z.string().uuid(),
  status: z.string(),
  durationHours: z.number(),
  counterOfferBursts: z.number().int().nonnegative(),
  priceTension: z.number().min(0).max(1),
  retailerSensitivity: z.number().min(0).max(1),
  sponsorshipAssisted: z.boolean(),
  stalled: z.boolean(),
  conversionProbability: z.number().min(0).max(1),
  relationshipStrengthProxy: z.number().min(0).max(1),
});
export type NegotiationIntelligenceRow = z.infer<typeof NegotiationIntelligenceRowSchema>;

export const NegotiationIntelligenceResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  unstableNegotiations: z.number().int().nonnegative(),
  negotiationBursts24h: z.number().int().nonnegative(),
  rows: z.array(NegotiationIntelligenceRowSchema),
  moduleNote: z.string().optional(),
});
export type NegotiationIntelligenceResponse = z.infer<typeof NegotiationIntelligenceResponseSchema>;

export const OrderPressureCellSchema = z.object({
  territoryKey: z.string(),
  label: z.string(),
  pressure: z.number().min(0).max(1),
  drivers: z.array(z.string()),
});
export type OrderPressureCell = z.infer<typeof OrderPressureCellSchema>;

export const OrderPressureResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  surgeTerritories: z.array(z.string()),
  retailerPressure: z.number().min(0).max(1),
  distributorOverload: z.number().min(0).max(1),
  productShortageSignals: z.number().int().nonnegative(),
  reservationSpike: z.number().min(0).max(1),
  fulfillmentAnomalyScore: z.number().min(0).max(1),
  cells: z.array(OrderPressureCellSchema),
});
export type OrderPressureResponse = z.infer<typeof OrderPressureResponseSchema>;

export const GroupBuyingSessionRowSchema = z.object({
  sessionId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  status: z.string(),
  thresholdProgress: z.number().min(0).max(1),
  participantCount: z.number().int().nonnegative(),
  expiresAt: z.string(),
  pressure: z.number().min(0).max(1),
  velocityHint: z.enum(["stalled", "steady", "surge"]),
});
export type GroupBuyingSessionRow = z.infer<typeof GroupBuyingSessionRowSchema>;

export const GroupBuyingSupervisionResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  activeSessions: z.number().int().nonnegative(),
  rows: z.array(GroupBuyingSessionRowSchema),
  dataSource: z.literal("GroupBuyingSession_prisma"),
});
export type GroupBuyingSupervisionResponse = z.infer<typeof GroupBuyingSupervisionResponseSchema>;

export const ReservationAllocationRowSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  reservedDraftUnits: z.number(),
  /** Instruction 14A — units from explicit ReservationIntent rows (REQUESTED/RESERVED). */
  intentReservedUnits: z.number().optional(),
  allocationConflictScore: z.number().min(0).max(1),
  expirationPressure: z.number().min(0).max(1),
  retailerReservationPressure: z.number().min(0).max(1),
});
export type ReservationAllocationRow = z.infer<typeof ReservationAllocationRowSchema>;

export const ReservationAllocationResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  rows: z.array(ReservationAllocationRowSchema),
  moduleNote: z.string().optional(),
});
export type ReservationAllocationResponse = z.infer<typeof ReservationAllocationResponseSchema>;

export const DeliveryPriorityRowSchema = z.object({
  orderId: z.string().uuid(),
  priorityScore: z.number().min(0).max(1),
  deliveryStatus: z.string(),
  blocked: z.boolean(),
  confirmationLagHours: z.number().nonnegative(),
  congestionHint: z.string(),
});
export type DeliveryPriorityRow = z.infer<typeof DeliveryPriorityRowSchema>;

export const DeliveryPriorityResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  urgentDeliveries: z.number().int().nonnegative(),
  blockedDeliveries: z.number().int().nonnegative(),
  fulfillmentInstability: z.number().min(0).max(1),
  rows: z.array(DeliveryPriorityRowSchema),
});
export type DeliveryPriorityResponse = z.infer<typeof DeliveryPriorityResponseSchema>;

export const AdvCoordinationQueueItemSchema = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string(),
  state: z.string(),
  tension: z.number().min(0).max(1),
});
export type AdvCoordinationQueueItem = z.infer<typeof AdvCoordinationQueueItemSchema>;

export const AdvCoordinationResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  validationQueueDepth: z.number().int().nonnegative(),
  pendingConfirmations: z.number().int().nonnegative(),
  invoiceReadiness: z.number().min(0).max(1),
  items: z.array(AdvCoordinationQueueItemSchema),
});
export type AdvCoordinationResponse = z.infer<typeof AdvCoordinationResponseSchema>;

export const OrderRiskMatrixRowSchema = z.object({
  id: z.string(),
  severity: z.enum(["info", "watch", "elevated", "critical"]),
  affectedOrganizationIds: z.array(z.string().uuid()),
  probableCause: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
  relatedSignals: z.array(z.string()),
});
export type OrderRiskMatrixRow = z.infer<typeof OrderRiskMatrixRowSchema>;

export const OrderRiskMatrixResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  policy: OrderAdvPolicySchema,
  rows: z.array(OrderRiskMatrixRowSchema),
});
export type OrderRiskMatrixResponse = z.infer<typeof OrderRiskMatrixResponseSchema>;

export const OrderAdvBriefingResponseSchema = z.object({
  provider: z.literal("MockAIProvider"),
  policy: OrderAdvPolicySchema,
  title: z.string().optional(),
  executiveSummary: z.string().optional(),
  anomalies: z.array(z.string()).optional(),
  recommendedActions: z.array(z.string()).optional(),
  dataSources: z.array(z.string()).optional(),
  tone: z.literal("execution_strategist").optional(),
  note: z.string().optional(),
});
export type OrderAdvBriefingResponse = z.infer<typeof OrderAdvBriefingResponseSchema>;

export const OrderAdvInterventionRankingBasisSchema = z.object({
  urgencyScore: z.number(),
  impactScore: z.number(),
  confidenceScore: z.number(),
  signalStrengthScore: z.number(),
  territoryFactor: z.number(),
  finalScore: z.number(),
});
export type OrderAdvInterventionRankingBasis = z.infer<typeof OrderAdvInterventionRankingBasisSchema>;

export const OrderAdvInterventionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  expectedImpact: z.string(),
  confidence: z.number(),
  relatedSignals: z.array(z.string()),
  affectedTerritories: z.array(z.string()),
  rankingBasis: OrderAdvInterventionRankingBasisSchema.optional(),
  finalScore: z.number().optional(),
});
export type OrderAdvIntervention = z.infer<typeof OrderAdvInterventionSchema>;

export const OrderAdvInterventionsResponseSchema = z.object({
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  interventions: z.array(OrderAdvInterventionSchema),
});
export type OrderAdvInterventionsResponse = z.infer<typeof OrderAdvInterventionsResponseSchema>;

export const OrderAdvBundleResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  overview: OrdersOverviewResponseSchema,
  conversationalCommerce: ConversationalCommerceResponseSchema,
  negotiations: NegotiationIntelligenceResponseSchema,
  orderPressure: OrderPressureResponseSchema,
  groupBuying: GroupBuyingSupervisionResponseSchema,
  reservations: ReservationAllocationResponseSchema,
  deliveryPriority: DeliveryPriorityResponseSchema,
  advCoordination: AdvCoordinationResponseSchema,
  riskMatrix: OrderRiskMatrixResponseSchema,
  briefing: OrderAdvBriefingResponseSchema,
  interventions: OrderAdvInterventionsResponseSchema,
});
export type OrderAdvBundleResponse = z.infer<typeof OrderAdvBundleResponseSchema>;
