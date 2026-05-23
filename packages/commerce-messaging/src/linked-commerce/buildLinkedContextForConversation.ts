import type { CommerceConversation, CommerceOrderContext } from "../hooks/commerce-messaging.types";
import {
  buildCommerceLinkedContext,
  inferSettlementFromOrder,
} from "./buildCommerceLinkedContext";
import type { CommerceLinkedContext, CommerceLinkedSettlement } from "./commerce-linked-context.types";

export function buildLinkedContextForConversation(input: {
  conversation: CommerceConversation;
  order?: CommerceOrderContext | null;
  settlement?: CommerceLinkedSettlement | null;
}): CommerceLinkedContext | null {
  const order = input.order ?? null;
  if (!order && !input.conversation.linkedOrderId) return null;

  const settlement =
    input.settlement ?? inferSettlementFromOrder(order);

  return buildCommerceLinkedContext({
    conversationId: input.conversation.id,
    partnerName: input.conversation.partnerName,
    partnerId: input.conversation.partnerId,
    city: input.conversation.city,
    productName: input.conversation.productName,
    order,
    settlement,
  });
}
