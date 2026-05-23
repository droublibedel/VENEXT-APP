import type { ProductMessagingContext } from "./terrain-audio.types.js";

const contexts = new Map<string, ProductMessagingContext>();

export function setProductMessagingContext(productId: string, ctx: ProductMessagingContext): void {
  contexts.set(productId, ctx);
}

export function getProductMessagingContext(productId: string): ProductMessagingContext | null {
  return contexts.get(productId) ?? null;
}

export function buildProductMessagingContext(input: {
  productId: string;
  productImage?: string;
  productAudioDescriptionId?: string;
  supplierId: string;
  relationshipId?: string;
}): ProductMessagingContext {
  const ctx: ProductMessagingContext = { ...input };
  setProductMessagingContext(input.productId, ctx);
  return ctx;
}

export function resetProductMessagingContextForTests(): void {
  contexts.clear();
}
