import { PERF_POLLING_FORBIDDEN_MS, PERF_WEBSOCKET_FORBIDDEN } from "./commerce-performance-limits";

const WEBSOCKET_PATTERNS =
  /\b(websocket|socket\.io|subscriptions?)\b|(?:\bwss?:\/\/)/i;
const AGGRESSIVE_POLLING = /\b(setInterval|poll(?:ing)?\s*every)\b/i;

export function assertNoWebsocketInStack(source: string): boolean {
  if (!PERF_WEBSOCKET_FORBIDDEN) return true;
  return !WEBSOCKET_PATTERNS.test(source);
}

export function assertManualRefreshOnly(pollingMs: number): boolean {
  return pollingMs === PERF_POLLING_FORBIDDEN_MS;
}

export function assertNoAggressivePollingInCode(source: string): boolean {
  if (assertManualRefreshOnly(PERF_POLLING_FORBIDDEN_MS)) {
    return !AGGRESSIVE_POLLING.test(source) || /POLLING_MS\s*=\s*0/.test(source);
  }
  return false;
}

/** Dedupe parallel fetches by key (in-memory, per session). */
const inflight = new Map<string, Promise<unknown>>();

export async function dedupeFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function clearDedupeFetchCache(): void {
  inflight.clear();
}
