import { PERF_DEFAULT_PAGE_SIZE } from "./commerce-performance-limits";

export type PaginateLightResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/** Light pagination — no infinite scroll (Instruction 20.85). */
export function paginateLight<T>(
  items: T[],
  page = 1,
  pageSize = PERF_DEFAULT_PAGE_SIZE,
): PaginateLightResult<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, Math.min(pageSize, 100));
  const start = (safePage - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);
  return {
    items: slice,
    total: items.length,
    page: safePage,
    pageSize: safeSize,
    hasMore: start + slice.length < items.length,
  };
}

/** Window slice for virtualized rendering without full DOM mount. */
export function sliceVisibleWindow<T>(items: T[], maxVisible: number, offset = 0): T[] {
  if (items.length <= maxVisible) return items;
  const safeOffset = Math.max(0, Math.min(offset, items.length - maxVisible));
  return items.slice(safeOffset, safeOffset + maxVisible);
}

export function batchSlice<T>(items: T[], batchSize: number): T[][] {
  const size = Math.max(1, batchSize);
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
