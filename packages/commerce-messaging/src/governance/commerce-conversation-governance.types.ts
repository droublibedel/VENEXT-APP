export type ConversationMode =
  | "DISABLED"
  | "FIXED_PRICE_ONLY"
  | "NEGOTIABLE"
  | "PARTNER_ONLY"
  | "ORDER_CONTEXT_ONLY";

export type CommerceMessagingAccountSettings = {
  messagingEnabled: boolean;
  defaultMode: ConversationMode;
  partnersOnly: boolean;
  authorizedPartnerIds: string[];
};

export type CommerceProductConversationSettings = {
  productId: string;
  conversationEnabled: boolean;
  conversationMode: ConversationMode;
};

export type OrderConversationScope = "open" | "readonly" | "delivery-only";

export type CommerceOrderConversationGovernance = {
  orderId: string;
  scope: OrderConversationScope;
  conversationMode?: ConversationMode;
};

export type ResolvedConversationGovernance = {
  mode: ConversationMode;
  badgeLabel: string;
  composerVisible: boolean;
  composerSuggestions: readonly string[];
  partnerAuthorized: boolean;
  orderNotice?: string;
  productNotice?: string;
};

export type ConversationGovernanceInput = {
  account: CommerceMessagingAccountSettings;
  product?: CommerceProductConversationSettings | null;
  order?: CommerceOrderConversationGovernance | null;
  partnerId?: string;
  partnerAuthorized?: boolean;
};
