import { clearDedupeFetchCache } from "./commerce-performance-network";

const RUNTIME_GEN_KEY = "venext:commerce-runtime-generation";
const RUNTIME_MEMO: Map<string, unknown> = new Map();

const listeners = new Set<() => void>();

export function invalidateRuntimeCommerceState(opts?: { clearMemo?: boolean }): void {
  if (opts?.clearMemo !== false) {
    RUNTIME_MEMO.clear();
  }
  clearDedupeFetchCache();
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(RUNTIME_GEN_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* listener isolation */
    }
  });
}

export function getRuntimeCommerceGeneration(): number {
  if (typeof sessionStorage === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(RUNTIME_GEN_KEY);
    return raw ? Number.parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function subscribeRuntimeInvalidation(handler: () => void): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function setRuntimeMemo<T>(key: string, value: T): void {
  RUNTIME_MEMO.set(key, value);
}

export function getRuntimeMemo<T>(key: string): T | undefined {
  return RUNTIME_MEMO.get(key) as T | undefined;
}

export function clearRuntimeMemo(): void {
  RUNTIME_MEMO.clear();
}
