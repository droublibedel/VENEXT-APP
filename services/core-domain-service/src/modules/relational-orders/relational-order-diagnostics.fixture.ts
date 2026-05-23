import type { RelationalOrderDiagnostics } from "@venext/shared-contracts";
import {
  RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
  RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST,
} from "@venext/shared-contracts";

/** Shared minimal diagnostics for contract / honesty tests (Instruction 20.0A fields). */
export function makeTestRelationalOrderDiagnostics(
  over: Partial<RelationalOrderDiagnostics> = {},
): RelationalOrderDiagnostics {
  const statusReadiness = {
    DRAFT: "PRISMA_MAPPED_FILTERABLE",
    NEGOTIATION: "PRISMA_MAPPED_FILTERABLE",
    PENDING_CONFIRMATION: "PRISMA_MAPPED_FILTERABLE",
    CONFIRMED: "PRISMA_MAPPED_FILTERABLE",
    PREPARING: "PRISMA_MAPPED_FILTERABLE",
    READY_FOR_DISPATCH: "PRISMA_MAPPED_FILTERABLE",
    IN_TRANSIT: "PRISMA_MAPPED_FILTERABLE",
    DELIVERED: "PRISMA_MAPPED_FILTERABLE",
    COMPLETED: "PRISMA_MAPPED_FILTERABLE",
    CANCELLED: "PRISMA_MAPPED_FILTERABLE",
    REJECTED: "PRISMA_MAPPED_FILTERABLE",
    EXPIRED: "NOT_CONNECTED_YET_NO_EXPIRY_SOURCE",
  } as const;

  const base: RelationalOrderDiagnostics = {
    relationshipScopedOnly: true,
    publicMarketplaceDisabled: true,
    publicDiscoveryDisabled: true,
    paymentNotIntegrated: true,
    logisticsRealtimeDisabled: true,
    symbolicFulfillmentOnly: true,
    roleScopedAccess: true,
    graphReuse: RELATIONAL_CATALOG_GRAPH_REUSE_TOKEN,
    fallbackUsed: false,
    viewerScopeMode: "RETAILER_SUPPLIER_ONLY",
    advisorySignalsOnly: true,
    sourceOfTruth: "PRISMA_ORDER_RELATIONSHIP_GRAPH",
    snapshotSource: "TEST",
    partnerSource: "GRAPH_BUNDLE",
    nextOrderCursor: null,
    ordersTruncated: false,
    ordersLimit: 16,
    orderScopeMode: "INCIDENT_RELATION_ORDERS",
    catalogScopeContrast: RELATIONAL_ORDER_CATALOG_SCOPE_CONTRAST,
    scopeExplanation:
      "Un grossiste lit ses catalogues fournisseurs en amont, mais lit ses commandes fournisseurs ET clients car les commandes sont bidirectionnelles.",
    relationshipDirectionValidated: true,
    rejectedByRelationshipDirectionCount: 0,
    emittedOrderTypes: ["DIRECT_RELATIONAL_ORDER"],
    unavailableOrderTypes: ["NEGOTIATED_ORDER", "GROUPED_PROCUREMENT_ORDER", "RESERVATION_CONVERSION_ORDER"],
    orderTypeReadiness: {
      DIRECT_RELATIONAL_ORDER: "ACTIVE",
      NEGOTIATED_ORDER: "NOT_CONNECTED_YET",
      GROUPED_PROCUREMENT_ORDER: "NOT_CONNECTED_YET",
      RESERVATION_CONVERSION_ORDER: "NOT_CONNECTED_YET",
    },
    emittedSignalTypes: [],
    unavailableSignalTypes: [
      "ORDER_CONCENTRATION_RISK",
      "DEPENDENCY_ORDER_RISK",
      "SYMBOLIC_STOCK_WARNING",
      "RELATIONAL_VOLUME_SHIFT",
      "DELIVERY_DELAY_RISK",
      "DORMANT_RELATION_ORDER_SIGNAL",
    ],
    signalReadiness: {
      ORDER_CONCENTRATION_RISK: "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
      DEPENDENCY_ORDER_RISK: "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
      SYMBOLIC_STOCK_WARNING: "REQUIRES_DEEPER_ORDER_ITEM_ANALYSIS",
      DELIVERY_DELAY_RISK: "AVAILABLE_CONDITIONAL_HEURISTIC",
      DORMANT_RELATION_ORDER_SIGNAL: "AVAILABLE_CONDITIONAL_HEURISTIC",
      RELATIONAL_VOLUME_SHIFT: "AVAILABLE_CONDITIONAL_HEURISTIC",
    },
    emittedStatuses: ["PENDING_CONFIRMATION"],
    unavailableStatuses: ["EXPIRED"],
    statusReadiness,
    requestedStatusUnsupported: false,
    catalogVisibilityRevalidated: false,
    orderLinesUseHistoricalOrderItems: true,
    catalogPolicySource: "ORDER_ITEM_PRODUCT_REFERENCE",
  };
  return { ...base, ...over };
}
