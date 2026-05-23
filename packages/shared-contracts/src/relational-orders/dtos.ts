import { z } from "zod";

import { RelationalCatalogRoleScopeModeSchema, RelationalCatalogViewerRoleSchema } from "../relational-catalog/dtos.js";

const unit = z.number().min(0).max(1);

/** Instruction 20.0 — corridor-private order lifecycle (no payment states). */
export const RelationalOrderStatusSchema = z.enum([
  "DRAFT",
  "NEGOTIATION",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
]);
export type RelationalOrderStatus = z.infer<typeof RelationalOrderStatusSchema>;

export const RelationalOrderTypeSchema = z.enum([
  "DIRECT_RELATIONAL_ORDER",
  "NEGOTIATED_ORDER",
  "GROUPED_PROCUREMENT_ORDER",
  "RESERVATION_CONVERSION_ORDER",
]);
export type RelationalOrderType = z.infer<typeof RelationalOrderTypeSchema>;

export const RelationalSymbolicFulfillmentStateSchema = z.enum([
  "NOT_STARTED",
  "PREPARING",
  "IN_MOTION",
  "DELIVERED_SYMBOLIC",
  "FAILED_SYMBOLIC",
  "UNKNOWN",
]);
export type RelationalSymbolicFulfillmentState = z.infer<typeof RelationalSymbolicFulfillmentStateSchema>;

export const RelationalOrderSignalTypeSchema = z.enum([
  "ORDER_CONCENTRATION_RISK",
  "DELIVERY_DELAY_RISK",
  "DEPENDENCY_ORDER_RISK",
  "DORMANT_RELATION_ORDER_SIGNAL",
  "RELATIONAL_VOLUME_SHIFT",
  "SYMBOLIC_STOCK_WARNING",
]);
export type RelationalOrderSignalType = z.infer<typeof RelationalOrderSignalTypeSchema>;

export const RelationalOrderSignalSchema = z.object({
  signalId: z.string().max(64),
  signalType: RelationalOrderSignalTypeSchema,
  severity: z.enum(["info", "low", "medium", "high"]),
  confidence: unit,
  confidenceExplanation: z.string().max(480),
  heuristicOnly: z.literal(true),
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  explanation: z.string().max(720),
  sourceSignals: z.array(z.string()).max(24),
});
export type RelationalOrderSignal = z.infer<typeof RelationalOrderSignalSchema>;

export const RelationalOrderLineSchema = z.object({
  productId: z.string().uuid(),
  catalogId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  symbolicAvailability: z.string().max(120),
  negotiated: z.boolean(),
  reserved: z.boolean(),
  lineSignals: z.array(z.string()).max(16),
  advisoryOnly: z.literal(true),
  symbolicStock: z.string().max(80),
  explanation: z.string().max(480),
});
export type RelationalOrderLine = z.infer<typeof RelationalOrderLineSchema>;

/** Instruction 20.0A — wholesaler catalog (19.2) vs orders (20) scope contrast token. */
export const RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST =
  "CATALOG_READ_IS_UPSTREAM_FOR_WHOLESALER_BUT_ORDER_READ_IS_INCIDENT" as const;

export const RelationalOrderScopeModeSchema = z.literal("INCIDENT_RELATION_ORDERS");
export type RelationalOrderScopeMode = z.infer<typeof RelationalOrderScopeModeSchema>;

export const RelationalOrderTypeReadinessValueSchema = z.enum(["ACTIVE", "NOT_CONNECTED_YET"]);
export const RelationalOrderTypeReadinessSchema = z.object({
  DIRECT_RELATIONAL_ORDER: RelationalOrderTypeReadinessValueSchema,
  NEGOTIATED_ORDER: RelationalOrderTypeReadinessValueSchema,
  GROUPED_PROCUREMENT_ORDER: RelationalOrderTypeReadinessValueSchema,
  RESERVATION_CONVERSION_ORDER: RelationalOrderTypeReadinessValueSchema,
});
export type RelationalOrderTypeReadiness = z.infer<typeof RelationalOrderTypeReadinessSchema>;

export const RelationalOrderSignalReadinessValueSchema = z.enum([
  "EMITTED_HEURISTIC",
  "AVAILABLE_CONDITIONAL_HEURISTIC",
  "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
  "NOT_CONNECTED_YET",
]);

export const RelationalOrderSignalReadinessSchema = z.object({
  ORDER_CONCENTRATION_RISK: RelationalOrderSignalReadinessValueSchema,
  DELIVERY_DELAY_RISK: RelationalOrderSignalReadinessValueSchema,
  DEPENDENCY_ORDER_RISK: RelationalOrderSignalReadinessValueSchema,
  DORMANT_RELATION_ORDER_SIGNAL: RelationalOrderSignalReadinessValueSchema,
  RELATIONAL_VOLUME_SHIFT: RelationalOrderSignalReadinessValueSchema,
  SYMBOLIC_STOCK_WARNING: RelationalOrderSignalReadinessValueSchema,
});
export type RelationalOrderSignalReadiness = z.infer<typeof RelationalOrderSignalReadinessSchema>;

export const RelationalOrderStatusReadinessValueSchema = z.enum([
  "PRISMA_MAPPED_FILTERABLE",
  "NOT_CONNECTED_YET_NO_EXPIRY_SOURCE",
]);

export const RelationalOrderStatusReadinessSchema = z.object({
  DRAFT: RelationalOrderStatusReadinessValueSchema,
  NEGOTIATION: RelationalOrderStatusReadinessValueSchema,
  PENDING_CONFIRMATION: RelationalOrderStatusReadinessValueSchema,
  CONFIRMED: RelationalOrderStatusReadinessValueSchema,
  PREPARING: RelationalOrderStatusReadinessValueSchema,
  READY_FOR_DISPATCH: RelationalOrderStatusReadinessValueSchema,
  IN_TRANSIT: RelationalOrderStatusReadinessValueSchema,
  DELIVERED: RelationalOrderStatusReadinessValueSchema,
  COMPLETED: RelationalOrderStatusReadinessValueSchema,
  CANCELLED: RelationalOrderStatusReadinessValueSchema,
  REJECTED: RelationalOrderStatusReadinessValueSchema,
  EXPIRED: RelationalOrderStatusReadinessValueSchema,
});
export type RelationalOrderStatusReadiness = z.infer<typeof RelationalOrderStatusReadinessSchema>;

export const RelationalOrderDiagnosticsSchema = z.object({
  relationshipScopedOnly: z.literal(true),
  publicMarketplaceDisabled: z.literal(true),
  publicDiscoveryDisabled: z.literal(true),
  paymentNotIntegrated: z.literal(true),
  logisticsRealtimeDisabled: z.literal(true),
  symbolicFulfillmentOnly: z.literal(true),
  roleScopedAccess: z.literal(true),
  graphReuse: z.string().max(360),
  fallbackUsed: z.boolean(),
  viewerScopeMode: RelationalCatalogRoleScopeModeSchema,
  advisorySignalsOnly: z.literal(true),
  sourceOfTruth: z.enum(["PRISMA_ORDER_RELATIONSHIP_GRAPH", "PRISMA_ORDER_PRISMA_RELATIONSHIP_FALLBACK"]),
  snapshotSource: z.string().max(160),
  partnerSource: z.enum(["GRAPH_BUNDLE", "PRISMA_FALLBACK"]),
  nextOrderCursor: z.string().max(120).nullable(),
  ordersTruncated: z.boolean(),
  ordersLimit: z.number().int().min(0),
  /** Instruction 20.0A — corridor orders read uses incident relationship geometry (wholesaler sees upstream + downstream orders). */
  orderScopeMode: RelationalOrderScopeModeSchema,
  catalogScopeContrast: z.literal(RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST),
  scopeExplanation: z.string().max(520),
  relationshipDirectionValidated: z.literal(true),
  rejectedByRelationshipDirectionCount: z.number().int().min(0),
  emittedOrderTypes: z.array(RelationalOrderTypeSchema).max(8),
  unavailableOrderTypes: z.array(RelationalOrderTypeSchema).max(8),
  orderTypeReadiness: RelationalOrderTypeReadinessSchema,
  emittedSignalTypes: z.array(RelationalOrderSignalTypeSchema).max(8),
  unavailableSignalTypes: z.array(RelationalOrderSignalTypeSchema).max(8),
  signalReadiness: RelationalOrderSignalReadinessSchema,
  emittedStatuses: z.array(RelationalOrderStatusSchema).max(16),
  unavailableStatuses: z.array(RelationalOrderStatusSchema).max(16),
  statusReadiness: RelationalOrderStatusReadinessSchema,
  requestedStatusUnsupported: z.boolean(),
  catalogVisibilityRevalidated: z.literal(false),
  orderLinesUseHistoricalOrderItems: z.literal(true),
  catalogPolicySource: z.literal("ORDER_ITEM_PRODUCT_REFERENCE"),
});
export type RelationalOrderDiagnostics = z.infer<typeof RelationalOrderDiagnosticsSchema>;

export const RelationalOrderSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  orderId: z.string().uuid(),
  orderNumber: z.string().max(48),
  orderType: RelationalOrderTypeSchema,
  orderStatus: RelationalOrderStatusSchema,
  relationshipId: z.string().uuid(),
  upstreamOrganizationId: z.string().uuid(),
  downstreamOrganizationId: z.string().uuid(),
  buyerRole: RelationalCatalogViewerRoleSchema,
  sellerRole: RelationalCatalogViewerRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  expectedPreparationWindow: z.string().max(160).nullable(),
  symbolicFulfillmentState: RelationalSymbolicFulfillmentStateSchema,
  negotiationAttached: z.boolean(),
  reservationOrigin: z.string().max(120).nullable(),
  groupedOrderOrigin: z.string().max(120).nullable(),
  advisoryOnly: z.literal(true),
  symbolicExecution: z.literal(true),
  heuristicSignals: z.array(RelationalOrderSignalSchema).max(16),
  orderLines: z.array(RelationalOrderLineSchema).max(64),
  visibilityBoundary: z.string().max(320),
  relationshipScopeMode: RelationalCatalogRoleScopeModeSchema,
});
export type RelationalOrderSnapshot = z.infer<typeof RelationalOrderSnapshotSchema>;

export const RelationalOrdersSnapshotSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string().uuid(),
  viewerRole: RelationalCatalogViewerRoleSchema,
  orders: z.array(RelationalOrderSnapshotSchema).max(48),
  diagnostics: RelationalOrderDiagnosticsSchema,
});
export type RelationalOrdersSnapshot = z.infer<typeof RelationalOrdersSnapshotSchema>;

export const RelationalOrdersResponseSchema = z.object({
  policy: z.enum(["ACTIVE", "DISABLED"]),
  snapshot: RelationalOrdersSnapshotSchema,
});
export type RelationalOrdersResponse = z.infer<typeof RelationalOrdersResponseSchema>;
