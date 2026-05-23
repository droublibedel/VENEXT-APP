import type { CommerceOrderContext } from "../hooks/commerce-messaging.types";

export type CommerceLinkedSettlementMethod =
  | "cash"
  | "mobile-money"
  | "bank-transfer"
  | "wallet"
  | "hybrid"
  | "manual-confirmation";

export type CommerceLinkedSettlement = {
  transactionId?: string;
  method: CommerceLinkedSettlementMethod;
  statusLabel: string;
  amountLabel: string;
  reference?: string;
  partnerConfirmed?: boolean;
};

export type CommerceLinkedTimelineStepId =
  | "product-shared"
  | "discussion-open"
  | "order-created"
  | "partner-validation"
  | "delivery"
  | "settlement-confirmed"
  | "activity-closed";

export type CommerceLinkedTimelineStep = {
  id: CommerceLinkedTimelineStepId;
  label: string;
  status: "done" | "current" | "pending";
  at?: string;
};

export type CommerceLinkedQuickActionId =
  | "view-order"
  | "view-settlement"
  | "confirm-receipt"
  | "view-activity"
  | "back-conversation";

export type CommerceLinkedView = "conversation" | "order" | "settlement" | "activity";

export type CommerceLinkedRelationshipMeta = {
  relationshipLabel?: string;
  communicationMode?: string;
  identityMode?: string;
  preferMail?: boolean;
  preferMessaging?: boolean;
};

export type CommerceLinkedContext = {
  conversationId: string;
  partnerName: string;
  partnerId?: string;
  city: string;
  productName?: string;
  order: CommerceOrderContext | null;
  settlement: CommerceLinkedSettlement | null;
  timeline: CommerceLinkedTimelineStep[];
  relationship?: CommerceLinkedRelationshipMeta;
};
