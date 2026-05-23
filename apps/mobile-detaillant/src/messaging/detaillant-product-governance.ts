import type { CommerceProductConversationSettings } from "commerce-messaging";

import type { DetaillantProduct } from "../hooks/detaillant-data.types";

/** Modes conversationnels détaillant — achat rapide par défaut (Instruction 20.60 / 20.62). */
export function detaillantProductConversationSettings(
  product: DetaillantProduct,
): CommerceProductConversationSettings {
  if (product.availability === "out") {
    return {
      productId: product.id,
      conversationEnabled: false,
      conversationMode: "DISABLED",
    };
  }
  if (product.availability === "limited" || product.badge === "stock-limite") {
    return {
      productId: product.id,
      conversationEnabled: true,
      conversationMode: "FIXED_PRICE_ONLY",
    };
  }
  if (product.badge === "tres-demande") {
    return {
      productId: product.id,
      conversationEnabled: true,
      conversationMode: "NEGOTIABLE",
    };
  }
  return {
    productId: product.id,
    conversationEnabled: true,
    conversationMode: "FIXED_PRICE_ONLY",
  };
}

export function detaillantProductSettingsById(
  products: DetaillantProduct[],
): Map<string, CommerceProductConversationSettings> {
  const map = new Map<string, CommerceProductConversationSettings>();
  for (const p of products) {
    map.set(p.id, detaillantProductConversationSettings(p));
  }
  return map;
}
