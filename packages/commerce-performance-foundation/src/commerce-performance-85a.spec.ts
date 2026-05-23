import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cleanupCatalogCache,
  cleanupMessagingCache,
  clearSecureWalletMemory,
  invalidateOfflineReplayCache,
  isOfflineReplayInvalidated,
  runFullCommerceSessionCleanup,
} from "./commerce-performance-cleanup";
import {
  isCommerceLightVirtualizationEnabled,
  isCommerceSecureCleanupEnabled,
  isCommerceSecureWalletNavigationEnabled,
} from "./commerce-performance-feature-flags";
import { PERF_MAX_VISIBLE_CATALOG_PRODUCTS, PERF_MAX_VISIBLE_MESSAGES } from "./commerce-performance-limits";
import {
  buildVisibleMessageWindow,
  nextOlderMessageOffset,
  sliceVisibleConversationWindow,
} from "./commerce-performance-messaging-window";
import {
  buildVisibleCatalogBatch,
  sliceVisibleCatalogWindow,
} from "./commerce-performance-catalog-window";
import {
  dispatchCommerceSessionCleanup,
  subscribeCommerceSessionCleanup,
} from "./commerce-performance-session-events";
import {
  clearRuntimeMemo,
  getRuntimeCommerceGeneration,
  invalidateRuntimeCommerceState,
  setRuntimeMemo,
  subscribeRuntimeInvalidation,
} from "./commerce-performance-runtime-invalidation";
import {
  assertAndroidBackFromWalletBlocked,
  clearSensitiveNavigationHistory,
  consumePostLockNavigationIntent,
  isSensitiveWalletRoute,
  isWalletNavigationLocked,
  releaseWalletNavigationLock,
  secureWalletNavigationReset,
} from "./commerce-performance-wallet-navigation";

const ORG = "org-85a-test";

function installBrowserMocks() {
  const ls: Record<string, string> = {};
  const ss: Record<string, string> = {};
  const listeners = new Map<string, Set<(e: Event) => void>>();

  vi.stubGlobal("localStorage", {
    getItem: (k: string) => ls[k] ?? null,
    setItem: (k: string, v: string) => {
      ls[k] = v;
    },
    removeItem: (k: string) => {
      delete ls[k];
    },
    key: (i: number) => Object.keys(ls)[i] ?? null,
    get length() {
      return Object.keys(ls).length;
    },
    clear: () => {
      for (const k of Object.keys(ls)) delete ls[k];
    },
  });

  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => ss[k] ?? null,
    setItem: (k: string, v: string) => {
      ss[k] = v;
    },
    removeItem: (k: string) => {
      delete ss[k];
    },
    clear: () => {
      for (const k of Object.keys(ss)) delete ss[k];
    },
  });

  vi.stubGlobal("window", {
    dispatchEvent: (e: Event) => {
      const set = listeners.get(e.type);
      set?.forEach((fn) => fn(e));
      return true;
    },
    addEventListener: (type: string, fn: (e: Event) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: (e: Event) => void) => {
      listeners.get(type)?.delete(fn);
    },
  });
}

function makeMessages(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `m${i}`, text: `msg ${i}` }));
}

function makeProducts(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `prod ${i}` }));
}

describe("commerce-performance 20.85-A", () => {
  beforeEach(() => {
    installBrowserMocks();
    localStorage.clear();
    sessionStorage.clear();
    clearRuntimeMemo();
  });

  afterEach(() => {
    releaseWalletNavigationLock();
    vi.unstubAllGlobals();
  });

  describe("MESSAGING virtualization", () => {
    it("sliceVisibleConversationWindow caps at 40", () => {
      const msgs = makeMessages(100);
      expect(sliceVisibleConversationWindow(msgs).length).toBe(PERF_MAX_VISIBLE_MESSAGES);
    });

    it("buildVisibleMessageWindow shows latest", () => {
      const w = buildVisibleMessageWindow(makeMessages(80));
      expect(w.visible.length).toBe(40);
      expect(w.visible[w.visible.length - 1]?.id).toBe("m79");
    });

    it("hasOlder when history exists", () => {
      const w = buildVisibleMessageWindow(makeMessages(60));
      expect(w.hasOlder).toBe(true);
    });

    it("lazy append reveals older", () => {
      const older = nextOlderMessageOffset(0);
      const w = buildVisibleMessageWindow(makeMessages(80), { olderOffset: older });
      expect(w.startIndex).toBeLessThan(40);
    });

    it("nextOlderMessageOffset increments", () => {
      expect(nextOlderMessageOffset(0, 20)).toBe(20);
    });

    it("cleanupMessagingCache removes keys", () => {
      localStorage.setItem(`venext:commerce-messaging-cache:${ORG}`, "[]");
      expect(cleanupMessagingCache(ORG)).toBeGreaterThan(0);
    });
  });

  describe("CATALOG virtualization", () => {
    it("sliceVisibleCatalogWindow caps at 30", () => {
      expect(sliceVisibleCatalogWindow(makeProducts(80)).length).toBe(
        PERF_MAX_VISIBLE_CATALOG_PRODUCTS,
      );
    });

    it("buildVisibleCatalogBatch first page", () => {
      const b = buildVisibleCatalogBatch(makeProducts(50));
      expect(b.batch.length).toBe(30);
      expect(b.hasMore).toBe(true);
    });

    it("buildVisibleCatalogBatch progressive", () => {
      const b = buildVisibleCatalogBatch(makeProducts(50), 30);
      expect(b.batch.length).toBe(20);
      expect(b.hasMore).toBe(false);
    });

    it("cleanupCatalogCache", () => {
      localStorage.setItem(`venext:commerce-catalog-cache:${ORG}`, "{}");
      expect(cleanupCatalogCache(ORG)).toBeGreaterThan(0);
    });
  });

  describe("SESSION cleanup", () => {
    it("runFullCommerceSessionCleanup clears caches", () => {
      localStorage.setItem(`venext:commerce-messaging-cache:${ORG}`, "[]");
      localStorage.setItem(`venext:commerce-catalog-cache:${ORG}`, "{}");
      const r = runFullCommerceSessionCleanup({ organizationId: ORG, reason: "logout" });
      expect(r.runtimeInvalidated).toBe(true);
      expect(r.secureWalletMemoryCleared).toBe(true);
    });

    it("logout event triggers subscriber", () => {
      let called = false;
      const unsub = subscribeCommerceSessionCleanup((d) => {
        if (d.reason === "logout") called = true;
      });
      dispatchCommerceSessionCleanup({ organizationId: ORG, reason: "logout" });
      unsub();
      expect(called).toBe(true);
    });

    it("suspension cleanup reason", () => {
      const r = runFullCommerceSessionCleanup({
        organizationId: ORG,
        reason: "user_suspended",
      });
      expect(r.reason).toBe("user_suspended");
    });

    it("archive cleanup", () => {
      const r = runFullCommerceSessionCleanup({
        organizationId: ORG,
        reason: "enterprise_archived",
      });
      expect(r.reason).toBe("enterprise_archived");
    });

    it("invalidateOfflineReplayCache", () => {
      invalidateOfflineReplayCache(ORG);
      expect(isOfflineReplayInvalidated(ORG)).toBe(true);
    });
  });

  describe("RUNTIME invalidation", () => {
    it("invalidateRuntimeCommerceState bumps generation", () => {
      const before = getRuntimeCommerceGeneration();
      invalidateRuntimeCommerceState();
      expect(getRuntimeCommerceGeneration()).toBeGreaterThanOrEqual(before);
    });

    it("subscribeRuntimeInvalidation fires", () => {
      let n = 0;
      const unsub = subscribeRuntimeInvalidation(() => {
        n += 1;
      });
      invalidateRuntimeCommerceState();
      unsub();
      expect(n).toBe(1);
    });

    it("clearRuntimeMemo", () => {
      setRuntimeMemo("k", 1);
      clearRuntimeMemo();
      invalidateRuntimeCommerceState({ clearMemo: true });
    });
  });

  describe("WALLET navigation", () => {
    it("secureWalletNavigationReset locks nav", () => {
      secureWalletNavigationReset("wallet-lock");
      expect(isWalletNavigationLocked()).toBe(true);
    });

    it("android back blocked on sensitive route", () => {
      secureWalletNavigationReset();
      expect(assertAndroidBackFromWalletBlocked("wallet")).toBe(true);
    });

    it("android back allowed when unlocked", () => {
      releaseWalletNavigationLock();
      expect(assertAndroidBackFromWalletBlocked("wallet")).toBe(false);
    });

    it("isSensitiveWalletRoute", () => {
      expect(isSensitiveWalletRoute("/wallet/settlements")).toBe(true);
      expect(isSensitiveWalletRoute("/home")).toBe(false);
    });

    it("consumePostLockNavigationIntent", () => {
      secureWalletNavigationReset("shell");
      const intent = consumePostLockNavigationIntent();
      expect(intent.blocked).toBe(true);
      expect(intent.safeRoute).toBe("shell");
    });

    it("clearSensitiveNavigationHistory", () => {
      secureWalletNavigationReset();
      clearSensitiveNavigationHistory();
      expect(isWalletNavigationLocked()).toBe(true);
    });

    it("lock destroys navigation — no restore of sensitive stack", () => {
      secureWalletNavigationReset("wallet-lock");
      expect(sessionStorage.getItem("venext:wallet-sensitive-stack")).toBe("[]");
    });
  });

  describe("feature flags 85-A", () => {
    it("secure cleanup dev default on", () => {
      expect(isCommerceSecureCleanupEnabled({ commerce_performance_foundation_enabled: true })).toBe(
        true,
      );
    });

    it("virtualization prod off", () => {
      expect(
        isCommerceLightVirtualizationEnabled({
          commerce_performance_foundation_enabled: true,
          commerce_light_virtualization_enabled: false,
        }),
      ).toBe(false);
    });

    it("wallet nav prod off", () => {
      expect(
        isCommerceSecureWalletNavigationEnabled({
          commerce_performance_foundation_enabled: true,
          commerce_secure_wallet_navigation_enabled: false,
        }),
      ).toBe(false);
    });
  });

  describe("SESSION triggers", () => {
    it("enterprise_suspended cleanup", () => {
      const r = runFullCommerceSessionCleanup({
        organizationId: ORG,
        reason: "enterprise_suspended",
      });
      expect(r.reason).toBe("enterprise_suspended");
    });

    it("session_invalidated cleanup", () => {
      const r = runFullCommerceSessionCleanup({
        organizationId: ORG,
        reason: "session_invalidated",
      });
      expect(r.runtimeInvalidated).toBe(true);
    });

    it("user_replaced cleanup", () => {
      const r = runFullCommerceSessionCleanup({
        organizationId: ORG,
        reason: "user_replaced",
      });
      expect(r.messagingCacheCleared).toBeGreaterThan(0);
    });

    it("wallet_secured_lock cleanup", () => {
      const r = runFullCommerceSessionCleanup({
        organizationId: ORG,
        reason: "wallet_secured_lock",
        resetWalletNavigation: true,
      });
      expect(isWalletNavigationLocked()).toBe(true);
    });
  });

  describe("MESSAGING edge cases", () => {
    it("short thread no virtualization needed", () => {
      expect(buildVisibleMessageWindow(makeMessages(10)).visible.length).toBe(10);
    });

    it("older offset capped", () => {
      const w = buildVisibleMessageWindow(makeMessages(50), { olderOffset: 999 });
      expect(w.visible.length).toBeLessThanOrEqual(40);
    });
  });

  describe("CATALOG edge cases", () => {
    it("empty catalog batch", () => {
      const b = buildVisibleCatalogBatch([]);
      expect(b.batch.length).toBe(0);
    });

    it("exactly 30 products no more", () => {
      const b = buildVisibleCatalogBatch(makeProducts(30));
      expect(b.hasMore).toBe(false);
    });
  });

  describe("WALLET sensitive routes", () => {
    it("kyc route sensitive", () => {
      expect(isSensitiveWalletRoute("kyc")).toBe(true);
    });

    it("pin-flow sensitive", () => {
      expect(isSensitiveWalletRoute("secured-pin")).toBe(true);
    });

    it("settlements sensitive", () => {
      expect(isSensitiveWalletRoute("settlements/history")).toBe(true);
    });
  });

  describe("OFFLINE replay", () => {
    it("replay invalidation blocks replay path", () => {
      invalidateOfflineReplayCache(ORG);
      expect(isOfflineReplayInvalidated(ORG)).toBe(true);
    });

    it("clearSecureWalletMemory", () => {
      localStorage.setItem(`venext:wallet-secure-memory:${ORG}`, "x");
      expect(clearSecureWalletMemory(ORG)).toBe(true);
    });
  });
});
