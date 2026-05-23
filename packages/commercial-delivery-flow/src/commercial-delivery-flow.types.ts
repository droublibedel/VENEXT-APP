export type CommercialDeliveryActorRole = "producteur" | "grossiste_a" | "grossiste_b" | "detaillant";

export type CommercialDeliveryStatus =
  | "DELIVERY_CREATED"
  | "PREPARING_LOADING"
  | "READY_FOR_DISPATCH"
  | "ON_THE_WAY"
  | "ARRIVING"
  | "DELIVERED"
  | "RECEPTION_CONFIRMED"
  | "DELIVERY_DELAYED"
  | "DELIVERY_INCIDENT"
  | "CLOSED";

export type CommercialDeliveryStepId =
  | "loading-prep"
  | "departure"
  | "on-route"
  | "arriving"
  | "delivered"
  | "reception-confirmed"
  | "activity-closed";

export type DeliveryTimelineStepStatus = "done" | "current" | "pending";

export type DeliveryTimelineStep = {
  id: CommercialDeliveryStepId;
  label: string;
  status: DeliveryTimelineStepStatus;
  at?: string;
};

export type CommercialDeliveryIncidentKind =
  | "delay"
  | "missing-quantity"
  | "postponed"
  | "partial-reception"
  | "damaged-product";

export type CommercialDeliveryIncident = {
  kind: CommercialDeliveryIncidentKind;
  label: string;
  reportedAt?: string;
};

export type CommercialDeliveryPartner = {
  id: string;
  displayName: string;
  secondaryName?: string;
  city: string;
  partnerType?: string;
};

export type CommercialDeliveryRoute = {
  originCity: string;
  destinationCity: string;
  corridorLabel?: string;
};

export type CommercialDeliveryLinks = {
  orderId?: string;
  orderReference?: string;
  conversationId?: string;
  mailThreadId?: string;
  walletTransactionId?: string;
  activityId?: string;
};

export type CommercialDeliverySettlement = {
  method: "cash" | "mobile-money" | "bank-transfer" | "wallet";
  statusLabel: string;
  amountLabel: string;
};

export type CommercialDelivery = {
  id: string;
  reference: string;
  status: CommercialDeliveryStatus;
  partner: CommercialDeliveryPartner;
  route: CommercialDeliveryRoute;
  amountLabel: string;
  updatedAt: string;
  settlement?: CommercialDeliverySettlement | null;
  incident?: CommercialDeliveryIncident | null;
  links: CommercialDeliveryLinks;
  sponsoredCorridor?: boolean;
  scenarioId?: "A" | "B" | "C" | "D" | "E";
};

export type CommercialDeliveryFlowView = {
  deliveries: CommercialDelivery[];
  activeDeliveryId: string | null;
};

export type CommercialDeliveryFlowFlags = {
  commercial_delivery_flow_enabled?: boolean;
  commercial_reception_confirmation_enabled?: boolean;
  commercial_delivery_activity_enabled?: boolean;
  commerce_linked_context_enabled?: boolean;
  commercial_relationship_governance_enabled?: boolean;
  commercial_multi_level_network_enabled?: boolean;
  commercial_relationship_context_enabled?: boolean;
};

export type CommercialDeliveryFlowInjected = {
  view?: CommercialDeliveryFlowView | null;
  loading?: boolean;
  error?: string | null;
  dataSource?: string;
  fallbackUsed?: boolean;
  onRefresh?: () => void;
};

export type CommercialDeliveryQuickActionId =
  | "confirm-departure"
  | "mark-arriving"
  | "confirm-delivery"
  | "confirm-reception"
  | "view-linked-order"
  | "view-settlement"
  | "open-conversation"
  | "open-mail"
  | "view-terrain-activity";

export type CommercialDeliveryFlowShellProps = {
  actorRole: CommercialDeliveryActorRole;
  enabled?: boolean;
  flags?: CommercialDeliveryFlowFlags;
  injected?: CommercialDeliveryFlowInjected;
  onQuickAction?: (actionId: CommercialDeliveryQuickActionId, deliveryId: string) => void;
  onStatusTransition?: (deliveryId: string, nextStatus: CommercialDeliveryStatus) => void;
  onSelectDelivery?: (deliveryId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
  onOpenMail?: (mailThreadId: string) => void;
  onOpenWallet?: (transactionId: string) => void;
  onOpenOrder?: (orderId: string) => void;
  onOpenActivity?: (activityId: string) => void;
  contextRouting?: import("commercial-context-routing").CommercialContextRoutingInput;
};
