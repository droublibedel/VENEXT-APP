export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export function paginate<T>(items: T[], page = 1, pageSize = 50): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(200, Math.max(1, pageSize));
  const start = (safePage - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);
  return {
    items: slice,
    total: items.length,
    page: safePage,
    pageSize: safeSize,
    hasMore: start + safeSize < items.length,
  };
}

export { lightweightListEnvelope, normalizeBackofficeEnvelope, envelopeFromArray, assertBackofficeDataResolved } from "./backoffice-lightweight-envelope.js";
export type { BackofficeLightweightEnvelope, BackofficeDataSource, BackofficeEnvelopeInput, BackofficeResolvedState } from "./backoffice-lightweight-envelope.js";
