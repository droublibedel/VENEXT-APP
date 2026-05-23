export type RelationalOrderActorRole = "producteur" | "grossiste_a" | "grossiste_b" | "detaillant";

export type OrderLifecycleStatus =
  | "CREATED"
  | "VALIDATED"
  | "PREPARING"
  | "READY_FOR_LOADING"
  | "IN_TRANSIT"
  | "DELIVERY_PENDING"
  | "DELIVERED"
  | "RECEPTION_CONFIRMED"
  | "SETTLEMENT_PENDING"
  | "SETTLEMENT_CONFIRMED"
  | "CLOSED"
  | "INCIDENT_REPORTED";

export type OrderLifecycleStepId =
  | "product-selected"
  | "order-sent"
  | "partner-validation"
  | "preparation"
  | "loading"
  | "shipment"
  | "delivery"
  | "reception-confirmed"
  | "settlement-confirmed"
  | "activity-closed";

export type OrderTimelineStepStatus = "done" | "current" | "pending";

export type OrderTimelineStep = {
  id: OrderLifecycleStepId;
  label: string;
  status: OrderTimelineStepStatus;
  at?: string;
};

export type RelationalOrderIncidentKind =
  | "delivery-delay"
  | "incomplete-quantity"
  | "confirmation-pending"
  | "damaged-product"
  | "settlement-pending";

export type RelationalOrderIncident = {
  kind: RelationalOrderIncidentKind;
  label: string;
  reportedAt?: string;
};

export type RelationalOrderPartner = {
  id: string;
  displayName: string;
  secondaryName?: string;
  city: string;
  partnerType: string;
};

export type RelationalOrderLine = {
  productId: string;
  productName: string;
  quantity: number;
  priceLabel: string;
};

export type RelationalOrderSettlement = {
  id?: string;
  method: "cash" | "mobile-money" | "bank-transfer" | "wallet" | "hybrid" | "manual-confirmation";
  statusLabel: string;
  amountLabel: string;
  optional?: boolean;
};

export type RelationalOrderLinks = {
  conversationId?: string;
  mailThreadId?: string;
  walletTransactionId?: string;
  activityId?: string;
  catalogProductId?: string;
};

export type RelationalCommercialOrder = {
  id: string;
  reference: string;
  status: OrderLifecycleStatus;
  partner: RelationalOrderPartner;
  lines: RelationalOrderLine[];
  amountLabel: string;
  updatedAt: string;
  city: string;
  settlement?: RelationalOrderSettlement | null;
  incident?: RelationalOrderIncident | null;
  links: RelationalOrderLinks;
  scenarioId?: "A" | "B" | "C" | "D" | "E";
  sponsoredCorridor?: boolean;
};

export type RelationalOrderOrchestrationView = {
  orders: RelationalCommercialOrder[];
  activeOrderId: string | null;
};

export type RelationalOrderOrchestrationFlags = {
  relational_order_orchestration_enabled?: boolean;
  commercial_delivery_flow_enabled?: boolean;
  commercial_settlement_flow_enabled?: boolean;
  commerce_linked_context_enabled?: boolean;
  commerce_linked_timeline_enabled?: boolean;
  commercial_relationship_governance_enabled?: boolean;
  commercial_multi_level_network_enabled?: boolean;
  commercial_relationship_context_enabled?: boolean;
  commerce_access_control_enabled?: boolean;
};

export type RelationalOrderOrchestrationInjected = {
  view?: RelationalOrderOrchestrationView | null;
  loading?: boolean;
  error?: string | null;
  dataSource?: string;
  fallbackUsed?: boolean;
  onRefresh?: () => void;
};

export type RelationalOrderQuickActionId =
  | "validate-order"
  | "confirm-preparation"
  | "mark-shipped"
  | "confirm-delivery"
  | "confirm-reception"
  | "view-settlement"
  | "open-conversation"
  | "open-mail"
  | "view-activity";

export type RelationalOrderPanelId =
  | "status"
  | "preparation"
  | "shipment"
  | "delivery"
  | "reception"
  | "settlement"
  | "incident"
  | "activity";

export type RelationalOrderOrchestrationCallbacks = {
  onQuickAction?: (actionId: RelationalOrderQuickActionId, orderId: string) => void;
  onStatusTransition?: (orderId: string, nextStatus: OrderLifecycleStatus) => void;
  onSelectOrder?: (orderId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
  onOpenMail?: (mailThreadId: string) => void;
  onOpenWallet?: (transactionId: string) => void;
  onOpenActivity?: (activityId: string) => void;
};

export type RelationalOrderOrchestrationShellProps = {
  actorRole: RelationalOrderActorRole;
  enabled?: boolean;
  flags?: RelationalOrderOrchestrationFlags;
  injected?: RelationalOrderOrchestrationInjected;
  /** Instruction 20.76 — routing contextuel inter-modules (optionnel). */
  contextRouting?: import("commercial-context-routing").CommercialContextRoutingInput;
  /** Instruction 20.76-A — focus commande depuis navigation écran. */
  focusOrderId?: string | null;
} & RelationalOrderOrchestrationCallbacks;
