import type { CommerceProductConversationSettings } from "commerce-messaging";

import type { GrossisteAProduct } from "../../hooks/grossiste-a-data.types";

/** Map catalogue Grossiste A → modes conversationnels (Instruction 20.60). */
export function grossisteAProductConversationSettings(
  product: GrossisteAProduct,
): CommerceProductConversationSettings {
  if (product.category === "produits importés") {
    return {
      productId: product.id,
      conversationEnabled: true,
      conversationMode: "NEGOTIABLE",
    };
  }
  if (product.networkCoverage === "Abidjan" || product.networkCoverage === "Nord") {
    return {
      productId: product.id,
      conversationEnabled: true,
      conversationMode: "PARTNER_ONLY",
    };
  }
  if (product.demand === "slow" || product.availability === "Limité") {
    return {
      productId: product.id,
      conversationEnabled: true,
      conversationMode: "FIXED_PRICE_ONLY",
    };
  }
  return {
    productId: product.id,
    conversationEnabled: true,
    conversationMode: "NEGOTIABLE",
  };
}

export function grossisteAProductSettingsById(
  products: GrossisteAProduct[],
): Map<string, CommerceProductConversationSettings> {
  const map = new Map<string, CommerceProductConversationSettings>();
  for (const p of products) {
    map.set(p.id, grossisteAProductConversationSettings(p));
  }
  return map;
}
