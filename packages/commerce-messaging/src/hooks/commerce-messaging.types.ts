export type CommerceDataSource = "live" | "fallback" | "mixed";

export type ConversationCategory = "commandes" | "produits" | "reseau" | "activite-terrain";

export type MessageBusinessContext =
  | "grossiste_distribution"
  | "retailer_procurement"
  | "mixed_relationship";

export type CommerceConversation = {
  id: string;
  category: ConversationCategory;
  partnerName: string;
  partnerRole: string;
  recentActivity: string;
  productName?: string;
  activityStatus: string;
  needsReply: boolean;
  city: string;
  corridor?: string;
  linkedOrderId?: string;
  linkedOrderLabel?: string;
  /** Instruction 20.60 — partner key for governance authorization */
  partnerId?: string;
  productId?: string;
  conversationMode?: import("../governance/commerce-conversation-governance.types").ConversationMode;
  businessContext?: MessageBusinessContext;
};

export type MessageKind =
  | "text"
  | "voice"
  | "image"
  | "document"
  | "product"
  | "order"
  | "activity"
  | "catalog_share";

export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type CommerceMessage = {
  id: string;
  conversationId: string;
  kind: MessageKind;
  author: "self" | "partner";
  text: string;
  at: string;
  productId?: string;
  orderId?: string;
  attachmentLabel?: string;
  /** Suppression globale VENEXT — invisible des deux côtés */
  deletedGlobally?: boolean;
  voiceDurationSec?: number;
  voiceWaveform?: number[];
  voicePlaybackUrl?: string;
  imageUrl?: string;
  documentName?: string;
  status?: MessageDeliveryStatus;
  /** HH:mm sous la bulle */
  displayTime?: string;
  /** VENEXT-MOBILE-ARCHI-04A — contexte métier actif lors de l'envoi */
  businessContext?: MessageBusinessContext;
};

export type CommerceProductContext = {
  productId: string;
  name: string;
  availability: string;
  recentActivity: string;
  demand: string;
  networkStatus: string;
  city: string;
  conversationEnabled?: boolean;
  conversationMode?: import("../governance/commerce-conversation-governance.types").ConversationMode;
};

export type CommerceOrderContext = {
  orderId: string;
  partner: string;
  status: string;
  preparation: string;
  delivery: string;
  lateNote?: string;
  amountLabel: string;
  conversationScope?: import("../governance/commerce-conversation-governance.types").OrderConversationScope;
};

export type CommerceNetworkStrip = {
  corridor?: string;
  activeCity?: string;
  demandedProduct?: string;
  activePartner?: string;
};

export type CommerceMessagingBffEndpoint = "conversations" | "messages" | "product-context" | "order-context";

export type CommerceEnvelope<T> = {
  dataSource: CommerceDataSource;
  fallbackUsed: boolean;
  organizationId: string;
  payload: T;
};

export type CommerceLiveState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  dataSource: CommerceDataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};
