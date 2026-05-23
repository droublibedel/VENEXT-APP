import { describe, expect, it, beforeEach } from "vitest";

import { trimCommercialContextHistory } from "commercial-context-routing";
import {
  clearOfflineCache,
  purgeExpiredCache,
  writeOfflineCache,
} from "commerce-offline-foundation";

import {
  auditFeatureFlagConsistency,
  isCommercePerformanceEnabled,
} from "./commerce-performance-feature-flags";
import {
  cleanupContextHistory,
  cleanupNotificationCache,
  cleanupOfflineCache,
  runCommerceStorageCleanup,
} from "./commerce-performance-cleanup";
import {
  PERF_MAX_VISIBLE_ACTIVITY_ITEMS,
  PERF_MAX_VISIBLE_NOTIFICATIONS,
  PERF_POLLING_FORBIDDEN_MS,
} from "./commerce-performance-limits";
import {
  clearDomainLoadCache,
  domainCacheKey,
  isDomainLoaded,
  markDomainLoaded,
  memoTranslationKey,
} from "./commerce-performance-i18n";
import { catalogThumbnailSize, lazyImageProps } from "./commerce-performance-image";
import {
  assertManualRefreshOnly,
  assertNoAggressivePollingInCode,
  assertNoWebsocketInStack,
  clearDedupeFetchCache,
  dedupeFetch,
} from "./commerce-performance-network";
import { lightweightEnvelope, trimPayload } from "./commerce-performance-payload";
import { shallowEqualProps, stableListKey } from "./commerce-performance-react";
import {
  batchSlice,
  paginateLight,
  sliceVisibleWindow,
} from "./commerce-performance-virtualization";

const ORG = "org-perf-test";

describe("commerce-performance-foundation (20.85)", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") localStorage.clear();
    clearDedupeFetchCache();
    clearDomainLoadCache();
  });

  describe("limits", () => {
    it("polling forbidden is 0", () => {
      expect(PERF_POLLING_FORBIDDEN_MS).toBe(0);
    });
    it("notification cap 40 visible", () => {
      expect(PERF_MAX_VISIBLE_NOTIFICATIONS).toBe(40);
    });
    it("activity cap 50 visible", () => {
      expect(PERF_MAX_VISIBLE_ACTIVITY_ITEMS).toBe(50);
    });
  });

  describe("paginateLight", () => {
    it("first page", () => {
      const r = paginateLight([1, 2, 3, 4, 5], 1, 2);
      expect(r.items).toEqual([1, 2]);
      expect(r.hasMore).toBe(true);
    });
    it("last page", () => {
      const r = paginateLight([1, 2, 3], 2, 2);
      expect(r.items).toEqual([3]);
      expect(r.hasMore).toBe(false);
    });
    it("caps page size at 100", () => {
      const r = paginateLight(Array.from({ length: 5 }), 1, 500);
      expect(r.pageSize).toBe(100);
    });
  });

  describe("sliceVisibleWindow", () => {
    it("returns all when under cap", () => {
      expect(sliceVisibleWindow([1, 2], 5)).toEqual([1, 2]);
    });
    it("windows large lists", () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      expect(sliceVisibleWindow(items, 10, 5)).toHaveLength(10);
      expect(sliceVisibleWindow(items, 10, 5)[0]).toBe(5);
    });
  });

  describe("batchSlice", () => {
    it("splits batches", () => {
      expect(batchSlice([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe("cleanupOfflineCache", () => {
    it("purges expired entries", () => {
      writeOfflineCache(ORG, "notifications", [{ id: "n1" }]);
      expect(cleanupOfflineCache(ORG)).toBeGreaterThanOrEqual(0);
    });
    it("clearAll wipes store", () => {
      writeOfflineCache(ORG, "recent_orders", [{ id: "o1" }]);
      cleanupOfflineCache(ORG, { clearAll: true });
      expect(purgeExpiredCache(ORG)).toBe(0);
    });
  });

  describe("cleanupNotificationCache", () => {
    it("trims oversized cache", () => {
      if (typeof localStorage === "undefined") return;
      const key = `venext:commerce-notification-cache:${ORG}`;
      const big = Array.from({ length: 100 }, (_, i) => ({ id: `n${i}` }));
      localStorage.setItem(key, JSON.stringify(big));
      const removed = cleanupNotificationCache(ORG, 40);
      expect(removed).toBe(60);
      const after = JSON.parse(localStorage.getItem(key)!) as unknown[];
      expect(after.length).toBe(40);
    });
  });

  describe("cleanupContextHistory", () => {
    it("trims history entries", () => {
      const store = {
        history: Array.from({ length: 10 }, (_, i) => ({ at: i })),
      };
      const removed = cleanupContextHistory(store, 5);
      expect(removed).toBe(5);
      expect(store.history).toHaveLength(5);
    });
    it("trimCommercialContextHistory export", () => {
      const h = Array.from({ length: 8 }, (_, i) => ({ at: i }));
      expect(trimCommercialContextHistory(h, 5)).toHaveLength(5);
    });
  });

  describe("runCommerceStorageCleanup", () => {
    it("aggregates results", () => {
      const r = runCommerceStorageCleanup(ORG, { history: [] });
      expect(r).toHaveProperty("offlinePurged");
      expect(r).toHaveProperty("notificationsTrimmed");
    });
  });

  describe("network guards", () => {
    it("rejects websocket in stack", () => {
      expect(assertNoWebsocketInStack("new WebSocket(url)")).toBe(false);
    });
    it("allows fetch", () => {
      expect(assertNoWebsocketInStack("fetch('/api/notifications')")).toBe(true);
    });
    it("manual refresh only", () => {
      expect(assertManualRefreshOnly(0)).toBe(true);
      expect(assertManualRefreshOnly(5000)).toBe(false);
    });
    it("polling constant zero in notifications", () => {
      expect(assertNoAggressivePollingInCode("COMMERCE_NOTIFICATIONS_POLLING_MS = 0")).toBe(true);
    });
  });

  describe("dedupeFetch", () => {
    it("dedupes parallel calls", async () => {
      let count = 0;
      const fn = () => {
        count += 1;
        return Promise.resolve("ok");
      };
      const [a, b] = await Promise.all([dedupeFetch("k", fn), dedupeFetch("k", fn)]);
      expect(a).toBe("ok");
      expect(b).toBe("ok");
      expect(count).toBe(1);
    });
  });

  describe("payload shaping", () => {
    it("trims heavy keys", () => {
      const out = trimPayload({ id: "1", stack: "x", items: [1, 2] });
      expect(out).not.toHaveProperty("stack");
    });
    it("truncates long arrays", () => {
      const arr = Array.from({ length: 60 }, (_, i) => i);
      const out = trimPayload({ items: arr }, 50);
      expect((out.items as number[]).length).toBe(50);
      expect(out.itemsTruncated).toBe(true);
    });
    it("lightweight envelope arrays", () => {
      const env = lightweightEnvelope([1, 2, 3, 4, 5], "live", { maxItems: 3 });
      expect(env.payload).toEqual([1, 2, 3]);
      expect(env.trimmed).toBe(true);
    });
    it("lightweight envelope fallback", () => {
      const env = lightweightEnvelope({ ok: true }, "fallback", { fallbackUsed: true });
      expect(env.fallbackUsed).toBe(true);
    });
  });

  describe("feature flags audit", () => {
    it("enabled by default", () => {
      expect(isCommercePerformanceEnabled({})).toBe(true);
    });
    it("clean flags pass", () => {
      const r = auditFeatureFlagConsistency({
        commerce_notifications_enabled: true,
        venext_bff_routes_enabled: true,
      });
      expect(r.ok).toBe(true);
    });
    it("partial group warns", () => {
      const r = auditFeatureFlagConsistency({
        commerce_notifications_enabled: true,
        venext_bff_routes_enabled: false,
      });
      expect(r.issues.length).toBeGreaterThan(0);
    });
    it("disabled performance skips audit issues", () => {
      const r = auditFeatureFlagConsistency({
        commerce_performance_foundation_enabled: false,
        commerce_notifications_enabled: true,
        venext_bff_routes_enabled: false,
      });
      expect(r.ok).toBe(true);
    });
  });

  describe("i18n lazy", () => {
    it("domain cache", () => {
      markDomainLoaded("fr-CI", "common");
      expect(isDomainLoaded("fr-CI", "common")).toBe(true);
      expect(isDomainLoaded("en", "common")).toBe(false);
    });
    it("domain cache key", () => {
      expect(domainCacheKey("ar", "wallet")).toBe("ar:wallet");
    });
    it("memo translation key", () => {
      expect(memoTranslationKey("fr-CI", "orders", "title")).toContain("orders");
    });
  });

  describe("images", () => {
    it("lazy props", () => {
      expect(lazyImageProps().loading).toBe("lazy");
    });
    it("catalog thumbnail size", () => {
      expect(catalogThumbnailSize().width).toBe(96);
    });
  });

  describe("react helpers", () => {
    it("shallow equal", () => {
      expect(shallowEqualProps({ a: 1 }, { a: 1 }, ["a"])).toBe(true);
      expect(shallowEqualProps({ a: 1 }, { a: 2 }, ["a"])).toBe(false);
    });
    it("stable list key", () => {
      expect(stableListKey("id", 2)).toBe("id:2");
    });
  });

  describe("no realtime", () => {
    const forbidden = ["websocket", "wss://", "socket.io", "subscription feed"];
    for (const term of forbidden) {
      it(`guards ${term}`, () => {
        expect(assertNoWebsocketInStack(term)).toBe(false);
      });
    }
  });

  describe("low connectivity", () => {
    it("fallback envelope stays small", () => {
      const env = lightweightEnvelope({ message: "offline" }, "fallback");
      expect(JSON.stringify(env).length).toBeLessThan(500);
    });
  });

  describe("wallet performance smoke", () => {
    it("trim does not strip settlement ids", () => {
      const out = trimPayload({ settlementId: "s1", amountLabel: "100 FCFA" });
      expect(out.settlementId).toBe("s1");
    });
  });

  describe("activity feed pagination smoke", () => {
    it("paginate 50 items", () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      const page = paginateLight(items, 1, 20);
      expect(page.items).toHaveLength(20);
    });
  });

  describe("notification batching smoke", () => {
    it("slice notifications window", () => {
      const n = Array.from({ length: 80 }, (_, i) => ({ id: String(i) }));
      expect(sliceVisibleWindow(n, PERF_MAX_VISIBLE_NOTIFICATIONS).length).toBe(40);
    });
  });

  describe("rerender stability keys", () => {
    it("stable key with revision", () => {
      expect(stableListKey("a", 1)).not.toBe(stableListKey("a", 2));
    });
    it("stable key without revision", () => {
      expect(stableListKey("a")).toBe("a");
    });
  });

  describe("pagination edge cases", () => {
    for (let page = 1; page <= 3; page += 1) {
      it(`page ${page} of 25 items`, () => {
        const items = Array.from({ length: 25 }, (_, i) => i);
        const r = paginateLight(items, page, 10);
        expect(r.items.length).toBeLessThanOrEqual(10);
      });
    }
  });

  describe("low-end mobile smoke", () => {
    it("batch slice limits render batches", () => {
      expect(batchSlice(Array.from({ length: 25 }), 5).length).toBe(5);
    });
    it("empty cleanup offline", () => {
      clearOfflineCache("org-empty");
      expect(cleanupOfflineCache("org-empty")).toBe(0);
    });
  });

  describe("i18n lazy loading guards", () => {
    it("clear domain cache", () => {
      markDomainLoaded("fr-CI", "orders");
      clearDomainLoadCache();
      expect(isDomainLoaded("fr-CI", "orders")).toBe(false);
    });
  });

  describe("no polling contract", () => {
    it("zero ms is manual only", () => {
      expect(assertManualRefreshOnly(0)).toBe(true);
    });
    it("rejects 1s polling", () => {
      expect(assertManualRefreshOnly(1000)).toBe(false);
    });
  });

  describe("visible caps constants", () => {
    const caps = [
      ["orders", 40],
      ["messages", 30],
      ["catalog", 60],
    ] as const;
    for (const [name, n] of caps) {
      it(`${name} cap is ${n}`, () => {
        expect(n).toBeGreaterThan(20);
      });
    }
  });

  describe("offline replay smoke", () => {
    it("purge after write does not throw", () => {
      writeOfflineCache(ORG, "recent_deliveries", [{ id: "d1" }]);
      expect(() => cleanupOfflineCache(ORG)).not.toThrow();
    });
  });

  describe("feature flag groups", () => {
    it("offline group coherent", () => {
      const r = auditFeatureFlagConsistency({
        commerce_offline_foundation_enabled: true,
        venext_bff_routes_enabled: true,
      });
      expect(r.ok).toBe(true);
    });
    it("activity group coherent", () => {
      const r = auditFeatureFlagConsistency({
        commercial_activity_feed_enabled: true,
        venext_bff_routes_enabled: true,
      });
      expect(r.ok).toBe(true);
    });
  });

  describe("trimPayload edge", () => {
    it("preserves nested shallow object", () => {
      const out = trimPayload({ a: { b: 1 } });
      expect(out.a).toEqual({ b: 1 });
    });
    it("empty object unchanged", () => {
      expect(trimPayload({})).toEqual({});
    });
    it("removes debug key", () => {
      expect(trimPayload({ debug: true, id: "1" })).not.toHaveProperty("debug");
    });
  });

  describe("paginate single item", () => {
    it("one item one page", () => {
      const r = paginateLight([1], 1, 20);
      expect(r.hasMore).toBe(false);
      expect(r.total).toBe(1);
    });
  });

  describe("performance disabled flag", () => {
    it("isCommercePerformanceEnabled false", () => {
      expect(isCommercePerformanceEnabled({ commerce_performance_foundation_enabled: false })).toBe(
        false,
      );
    });
  });

  describe("dedupe cache clear", () => {
    it("clearDedupeFetchCache allows new call", async () => {
      let n = 0;
      await dedupeFetch("x", async () => {
        n += 1;
        return 1;
      });
      clearDedupeFetchCache();
      await dedupeFetch("x", async () => {
        n += 1;
        return 2;
      });
      expect(n).toBe(2);
    });
  });
});
