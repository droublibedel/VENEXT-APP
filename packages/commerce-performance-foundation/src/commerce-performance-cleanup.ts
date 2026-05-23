import { clearOfflineCache, purgeExpiredCache } from "commerce-offline-foundation";
import { trimCommercialContextHistory } from "commercial-context-routing";

import type {
  CommerceCleanupResult,
  FullCommerceCleanupResult,
} from "./commerce-performance.types";
import type { CommerceSessionCleanupReason } from "./commerce-performance-session-events";
import { invalidateRuntimeCommerceState } from "./commerce-performance-runtime-invalidation";
import {
  clearSensitiveNavigationHistory,
  secureWalletNavigationReset,
} from "./commerce-performance-wallet-navigation";
import {
  PERF_MAX_CONTEXT_HISTORY,
  PERF_MAX_NOTIFICATION_CACHE,
} from "./commerce-performance-limits";

const NOTIFICATION_CACHE_PREFIX = "venext:commerce-notification-cache:";
const MESSAGING_CACHE_PREFIX = "venext:commerce-messaging-cache:";
const CATALOG_CACHE_PREFIX = "venext:commerce-catalog-cache:";
const WALLET_SECURE_MEMORY_PREFIX = "venext:wallet-secure-memory:";
const OFFLINE_REPLAY_INVALID_PREFIX = "venext:offline-replay-invalid:";

/** Purge expired offline domains + optional full clear. */
export function cleanupOfflineCache(organizationId: string, opts?: { clearAll?: boolean }): number {
  if (opts?.clearAll) {
    clearOfflineCache(organizationId);
    return 0;
  }
  return purgeExpiredCache(organizationId);
}

/** Trim notification localStorage cache (Instruction 20.85). */
export function cleanupNotificationCache(
  organizationId: string,
  maxItems = PERF_MAX_NOTIFICATION_CACHE,
): number {
  if (typeof localStorage === "undefined") return 0;
  const key = `${NOTIFICATION_CACHE_PREFIX}${organizationId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(key);
      return 0;
    }
    if (parsed.length <= maxItems) return 0;
    const trimmed = parsed.slice(0, maxItems);
    localStorage.setItem(key, JSON.stringify(trimmed));
    return parsed.length - trimmed.length;
  } catch {
    localStorage.removeItem(key);
    return 0;
  }
}

export type ContextHistoryStore = {
  history: { at: number }[];
};

/** Trim in-memory context navigation history. */
export function cleanupContextHistory(
  store: ContextHistoryStore,
  maxEntries = PERF_MAX_CONTEXT_HISTORY,
): number {
  const before = store.history.length;
  const trimmed = trimCommercialContextHistory(store.history, maxEntries);
  store.history = trimmed;
  return Math.max(0, before - trimmed.length);
}

function purgeStoragePrefix(prefix: string, organizationId: string): number {
  if (typeof localStorage === "undefined") return 0;
  let removed = 0;
  const key = `${prefix}${organizationId}`;
  if (localStorage.getItem(key) != null) {
    localStorage.removeItem(key);
    removed += 1;
  }
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) {
      localStorage.removeItem(k);
      removed += 1;
    }
  }
  return removed;
}

/** Purge messaging thread/conversation cache (Instruction 20.85-A). */
export function cleanupMessagingCache(organizationId: string): number {
  return purgeStoragePrefix(MESSAGING_CACHE_PREFIX, organizationId);
}

/** Purge relational catalog product cache (Instruction 20.85-A). */
export function cleanupCatalogCache(organizationId: string): number {
  return purgeStoragePrefix(CATALOG_CACHE_PREFIX, organizationId);
}

/** Clear in-memory / session wallet sensitive scratch (PIN flow buffers, etc.). */
export function clearSecureWalletMemory(organizationId?: string): boolean {
  if (organizationId) {
    purgeStoragePrefix(WALLET_SECURE_MEMORY_PREFIX, organizationId);
  }
  if (typeof sessionStorage !== "undefined") {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const k = sessionStorage.key(i);
        if (k?.includes("wallet") && (k.includes("secure") || k.includes("pin") || k.includes("kyc"))) {
          sessionStorage.removeItem(k);
        }
      }
    } catch {
      return false;
    }
  }
  return true;
}

/** Block offline replay after suspension / logout (Instruction 20.85-A). */
export function invalidateOfflineReplayCache(organizationId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${OFFLINE_REPLAY_INVALID_PREFIX}${organizationId}`, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isOfflineReplayInvalidated(organizationId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(`${OFFLINE_REPLAY_INVALID_PREFIX}${organizationId}`) != null;
  } catch {
    return false;
  }
}

export function runCommerceStorageCleanup(
  organizationId: string,
  store?: ContextHistoryStore,
): CommerceCleanupResult {
  return {
    offlinePurged: cleanupOfflineCache(organizationId),
    notificationsTrimmed: cleanupNotificationCache(organizationId),
    contextHistoryTrimmed: store ? cleanupContextHistory(store) : 0,
  };
}

/** Cleanup session complet — logout, suspension, archivage, lock wallet (20.85-A). */
export function runFullCommerceSessionCleanup(input: {
  organizationId: string;
  contextHistoryStore?: ContextHistoryStore;
  reason?: CommerceSessionCleanupReason;
  clearOffline?: boolean;
  resetWalletNavigation?: boolean;
}): FullCommerceCleanupResult {
  const base = runCommerceStorageCleanup(input.organizationId, input.contextHistoryStore);
  if (input.clearOffline !== false) {
    cleanupOfflineCache(input.organizationId, { clearAll: true });
  }
  cleanupMessagingCache(input.organizationId);
  cleanupCatalogCache(input.organizationId);
  invalidateOfflineReplayCache(input.organizationId);
  const secureWalletMemoryCleared = clearSecureWalletMemory(input.organizationId);
  if (input.resetWalletNavigation !== false) {
    secureWalletNavigationReset();
    clearSensitiveNavigationHistory();
  }
  invalidateRuntimeCommerceState();
  return {
    ...base,
    messagingCacheCleared: 1,
    catalogCacheCleared: 1,
    secureWalletMemoryCleared,
    runtimeInvalidated: true,
    reason: input.reason,
  };
}
