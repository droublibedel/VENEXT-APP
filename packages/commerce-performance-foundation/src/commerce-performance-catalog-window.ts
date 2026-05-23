import { PERF_MAX_VISIBLE_CATALOG_PRODUCTS } from "./commerce-performance-limits";

export type VisibleCatalogBatch<T> = {
  batch: T[];
  total: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number;
};

/** Fenêtre catalogue terrain — max 30 cartes simultanées (Instruction 20.85-A). */
export function sliceVisibleCatalogWindow<T>(
  products: readonly T[],
  maxVisible = PERF_MAX_VISIBLE_CATALOG_PRODUCTS,
  offset = 0,
): T[] {
  const safeOffset = Math.max(0, Math.min(offset, products.length));
  return products.slice(safeOffset, safeOffset + maxVisible);
}

export function buildVisibleCatalogBatch<T>(
  products: readonly T[],
  offset = 0,
  maxVisible = PERF_MAX_VISIBLE_CATALOG_PRODUCTS,
): VisibleCatalogBatch<T> {
  const safeOffset = Math.max(0, Math.min(offset, products.length));
  const batch = products.slice(safeOffset, safeOffset + maxVisible);
  const nextOffset = safeOffset + batch.length;
  return {
    batch,
    total: products.length,
    offset: safeOffset,
    hasMore: nextOffset < products.length,
    nextOffset,
  };
}
