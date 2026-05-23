export type CommercialContextModule =
  | "catalog"
  | "order"
  | "delivery"
  | "wallet"
  | "messaging"
  | "mail"
  | "activity"
  | "network";

export type CommercialContextTransitionId =
  | "catalog-to-order"
  | "order-to-delivery"
  | "order-to-messaging"
  | "order-to-mail"
  | "order-to-wallet"
  | "delivery-to-reception"
  | "wallet-to-activity"
  | "messaging-to-order"
  | "mail-to-order"
  | "wallet-to-order"
  | "order-to-activity"
  | "delivery-to-order"
  | "context-back";

export type CommercialContextReference = {
  activeModule?: CommercialContextModule;
  partnerId?: string;
  orderId?: string;
  deliveryId?: string;
  settlementId?: string;
  conversationId?: string;
  mailThreadId?: string;
  catalogId?: string;
  activityId?: string;
  productId?: string;
  supplierId?: string;
};

export type CommercialContextLinkGraph = {
  byOrderId?: Record<string, Partial<CommercialContextReference>>;
  byDeliveryId?: Record<string, Partial<CommercialContextReference>>;
  byConversationId?: Record<string, Partial<CommercialContextReference>>;
  byMailThreadId?: Record<string, Partial<CommercialContextReference>>;
  bySettlementId?: Record<string, Partial<CommercialContextReference>>;
  byCatalogId?: Record<string, Partial<CommercialContextReference>>;
};

export type CommercialNavigationIntent = {
  target: CommercialContextModule;
  transition: CommercialContextTransitionId;
  reference: CommercialContextReference;
  label: string;
  inline: boolean;
};

export type CommercialContextRoutingFlags = {
  commercial_context_routing_enabled?: boolean;
  commercial_context_history_enabled?: boolean;
  commercial_cross_module_navigation_enabled?: boolean;
};

export type CommercialContextHistoryEntry = {
  at: number;
  module: CommercialContextModule;
  reference: CommercialContextReference;
  label: string;
};

export type CommercialContextStore = {
  active: CommercialContextReference;
  history: CommercialContextHistoryEntry[];
};

export type CommercialContextRouter = {
  store: CommercialContextStore;
  flags: CommercialContextRoutingFlags;
  navigate: (
    transition: CommercialContextTransitionId,
    partial?: Partial<CommercialContextReference>,
  ) => CommercialNavigationIntent | null;
  goBack: () => CommercialContextReference | null;
  orderShellHandlers: () => {
    onOpenConversation?: (conversationId: string) => void;
    onOpenMail?: (mailThreadId: string) => void;
    onOpenWallet?: (transactionId: string) => void;
    onOpenActivity?: (activityId: string) => void;
    onQuickAction?: (actionId: string, orderId: string) => void;
  };
  deliveryShellHandlers: () => {
    onOpenConversation?: (conversationId: string) => void;
    onOpenMail?: (mailThreadId: string) => void;
    onOpenWallet?: (transactionId: string) => void;
    onOpenOrder?: (orderId: string) => void;
    onOpenActivity?: (activityId: string) => void;
  };
  catalogShellHandlers: () => {
    onQuickOrder?: (supplierId: string, productId: string) => void;
    onDiscuss?: (supplierId: string, productId: string) => void;
    onMail?: (supplierId: string) => void;
  };
  messagingHandlers: () => {
    onViewOrder?: (orderId: string) => void;
    onViewSettlement?: (settlementId: string) => void;
  };
};

export type CommercialContextRoutingInput = {
  flags?: CommercialContextRoutingFlags;
  router?: CommercialContextRouter;
  linkGraph?: CommercialContextLinkGraph;
  onNavigate?: (intent: CommercialNavigationIntent) => void;
};
