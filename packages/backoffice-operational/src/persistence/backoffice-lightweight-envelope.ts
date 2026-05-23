import type { PaginatedResult } from "./lightweight-envelope.js";
import { paginate } from "./lightweight-envelope.js";
import { backofficeOperationalResponseMeta } from "./operational-response-meta.js";
import { resolveOperationalPersistenceMode } from "./operational-persistence-mode.js";

export type BackofficeDataSource = "LIVE" | "FALLBACK" | "MIXED";

export type BackofficeLightweightEnvelope<T> = {
  payload: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  dataSource: BackofficeDataSource;
  generatedAt: string;
  fallbackUsed?: boolean;
  persistenceMode?: string;
};

export type BackofficeEnvelopeInput<T> = {
  payload?: T[];
  items?: T[];
  data?: T[] | T;
  rows?: T[];
  records?: T[];
  pagination?: Partial<BackofficeLightweightEnvelope<T>["pagination"]>;
  dataSource?: string;
  fallbackUsed?: boolean;
  persistenceMode?: string;
  generatedAt?: string;
};

function coerceArray<T>(value: unknown): T[] | undefined {
  if (Array.isArray(value)) return value as T[];
  return undefined;
}

function normalizeDataSource(raw?: string, fallbackUsed?: boolean): BackofficeDataSource {
  if (fallbackUsed) return "FALLBACK";
  const v = String(raw ?? "LIVE").toUpperCase();
  if (v === "FALLBACK") return "FALLBACK";
  if (v === "MIXED") return "MIXED";
  return "LIVE";
}

/** Compatibilité descendante : items / data / rows / records → payload officiel. */
export function normalizeBackofficeEnvelope<T>(
  input: BackofficeEnvelopeInput<T> | unknown,
  defaults?: Partial<BackofficeLightweightEnvelope<T>>,
): BackofficeLightweightEnvelope<T> {
  const row = (input && typeof input === "object" ? input : {}) as BackofficeEnvelopeInput<T>;
  const payload =
    coerceArray<T>(row.payload) ??
    coerceArray<T>(row.items) ??
    coerceArray<T>(row.rows) ??
    coerceArray<T>(row.records) ??
    coerceArray<T>(row.data) ??
    [];

  const pagination = row.pagination ?? defaults?.pagination;
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? Math.max(payload.length, 1);
  const total = pagination?.total ?? payload.length;

  return {
    payload,
    pagination: {
      total,
      page,
      pageSize,
      hasMore: pagination?.hasMore ?? page * pageSize < total,
    },
    dataSource: normalizeDataSource(row.dataSource ?? defaults?.dataSource, row.fallbackUsed ?? defaults?.fallbackUsed),
    generatedAt: row.generatedAt ?? defaults?.generatedAt ?? new Date().toISOString(),
    fallbackUsed: row.fallbackUsed ?? defaults?.fallbackUsed,
    persistenceMode: row.persistenceMode ?? defaults?.persistenceMode,
  };
}

export function lightweightListEnvelope<T>(
  result: PaginatedResult<T>,
  dataSource: "live" | "fallback" | "mixed",
): BackofficeLightweightEnvelope<T> {
  const resolution = resolveOperationalPersistenceMode();
  const meta = backofficeOperationalResponseMeta(dataSource === "fallback" || resolution.criticalDegraded);
  const ds = meta.dataSource;
  return normalizeBackofficeEnvelope<T>(
    {
      payload: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore,
      },
      dataSource: ds,
      fallbackUsed: meta.fallbackUsed,
      persistenceMode: meta.persistenceMode,
    },
    { generatedAt: new Date().toISOString() },
  );
}

export function envelopeFromArray<T>(
  items: T[],
  dataSource: BackofficeDataSource = "LIVE",
): BackofficeLightweightEnvelope<T> {
  const p = paginate(items, 1, Math.min(200, Math.max(items.length, 1)));
  return lightweightListEnvelope(p, dataSource === "FALLBACK" ? "fallback" : dataSource === "MIXED" ? "mixed" : "live");
}

export type BackofficeResolvedState = "loading" | "ready" | "empty" | "error";

export function assertBackofficeDataResolved<T>(
  envelope: BackofficeLightweightEnvelope<T> | null | undefined,
  phase: "loading" | "ready" | "error" = "ready",
): { state: BackofficeResolvedState; envelope: BackofficeLightweightEnvelope<T> } {
  if (phase === "loading") {
    return { state: "loading", envelope: envelope ?? normalizeBackofficeEnvelope<T>({}) };
  }
  if (phase === "error" || !envelope) {
    return { state: "error", envelope: envelope ?? normalizeBackofficeEnvelope<T>({}) };
  }
  if (!envelope.payload.length) {
    return { state: "empty", envelope };
  }
  return { state: "ready", envelope };
}
