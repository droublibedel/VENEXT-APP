import {
  defaultCommerceAccountSettings,
  resolveConversationGovernance,
  type CommerceMessagingAccountSettings,
  type CommerceOrderConversationGovernance,
  type CommerceProductConversationSettings,
  type ResolvedConversationGovernance,
} from "commerce-messaging";

import type { GrossisteAOrderRow, GrossisteANetworkDto } from "../../hooks/grossiste-a-data.types";
import {
  grossisteAProductConversationSettings,
  grossisteAProductSettingsById,
} from "./grossiste-a-product-conversation-settings";

export type GrossisteAGovernanceSource = {
  network: GrossisteANetworkDto | null;
  catalogProducts: { id: string; name: string; category: string; availability: string; rotation: string; demand: "high" | "normal" | "slow"; networkCoverage: string }[];
  governanceEnabled: boolean;
};

export function buildGrossisteAAccountSettings(
  network: GrossisteANetworkDto | null,
): CommerceMessagingAccountSettings {
  const base = defaultCommerceAccountSettings();
  return {
    ...base,
    messagingEnabled: true,
    defaultMode: "NEGOTIABLE",
    partnersOnly: false,
    authorizedPartnerIds: (network?.activePartners ?? []).map((p) => p.id),
  };
}

export function grossisteAOrderGovernance(order: GrossisteAOrderRow): CommerceOrderConversationGovernance {
  if (order.status === "livraison") {
    return { orderId: order.id, scope: "delivery-only", conversationMode: "ORDER_CONTEXT_ONLY" };
  }
  if (order.status === "retard") {
    return { orderId: order.id, scope: "open", conversationMode: "NEGOTIABLE" };
  }
  if (order.status === "validation") {
    return { orderId: order.id, scope: "open", conversationMode: "NEGOTIABLE" };
  }
  return { orderId: order.id, scope: "readonly", conversationMode: "ORDER_CONTEXT_ONLY" };
}

export function buildGrossisteAGovernanceBundle(source: GrossisteAGovernanceSource) {
  const account = buildGrossisteAAccountSettings(source.network);
  const productMap = grossisteAProductSettingsById(source.catalogProducts);

  const resolveForConversation = (input: {
    conversationId: string;
    partnerId?: string;
    productId?: string;
    order?: GrossisteAOrderRow | null;
  }): ResolvedConversationGovernance => {
    if (!source.governanceEnabled) {
      return resolveConversationGovernance({ account });
    }

    const product: CommerceProductConversationSettings | null = input.productId
      ? (productMap.get(input.productId) ??
        grossisteAProductConversationSettings(
          source.catalogProducts.find((p) => p.id === input.productId) ?? {
            id: input.productId,
            name: "",
            category: "riz",
            availability: "Disponible",
            rotation: "Moyenne",
            demand: "normal",
            networkCoverage: "Large",
          },
        ))
      : null;

    const order = input.order ? grossisteAOrderGovernance(input.order) : null;

    return resolveConversationGovernance({
      account,
      product,
      order,
      partnerId: input.partnerId,
      partnerAuthorized: input.partnerId
        ? account.authorizedPartnerIds.includes(input.partnerId)
        : true,
    });
  };

  return { account, productMap, resolveForConversation };
}
