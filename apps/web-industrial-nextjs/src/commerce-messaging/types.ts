export type Jsonish = Record<string, unknown> | null;

export type CommerceMessage = {
  id: string;
  threadId: string;
  senderUserId: string;
  senderOrganizationId: string;
  messageType: string;
  content: string | null;
  mediaUrls: string[];
  voiceUrl: string | null;
  structuredEvent: Jsonish;
  deliveryState: string;
  createdAt: string;
  readAt: string | null;
};

export type CommerceContextResponse = {
  id: string;
  threadType: string;
  productId: string | null;
  orderId: string | null;
  negotiationId: string | null;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  product: null | {
    id: string;
    name: string;
    imageUrls: string[];
    stockStatus: string;
    paymentModes: string[];
    organization: { id: string; displayName: string; commercialId: string };
  };
  order: null | {
    id: string;
    status: string;
    paymentStatus: string;
    deliveryStatus: string;
    totalAmount: string;
    currency: string;
  };
  negotiation: null | {
    id: string;
    status: string;
    proposedQuantity: string | null;
    proposedPrice: string | null;
    acceptedQuantity: string | null;
    acceptedPrice: string | null;
  };
  messages: CommerceMessage[];
  /** Instruction 20.1B — commerce thread access diagnostics (optional). */
  access?: Record<string, unknown>;
};
