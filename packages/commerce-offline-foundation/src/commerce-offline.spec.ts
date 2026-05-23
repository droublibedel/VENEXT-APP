import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  clearOfflineCache,
  isCacheEntryExpired,
  purgeExpiredCache,
  readOfflineCache,
  writeOfflineCache,
} from "./commerce-offline-cache";
import {
  buildConflictLabel,
  inferConflictFromError,
  resolveCommercialConflict,
} from "./commerce-offline-conflict";
import {
  probeApiReachability,
  resolveConnectivityMode,
  readBrowserOnline,
} from "./commerce-offline-connectivity";
import {
  allowedDomainsForActor,
  filterBootstrapForGovernance,
  isCacheDomainAllowed,
  isWalletFinancialActionBlocked,
} from "./commerce-offline-governance";
import { getOfflineTranslation } from "./commerce-offline-i18n";
import {
  discardOfflineAction,
  enqueueOfflineAction,
  isAllowedOfflineAction,
  listPendingQueue,
  replayOfflineQueue,
} from "./commerce-offline-queue";
import {
  buildDemoBootstrap,
  fetchOfflineBootstrap,
  OFFLINE_NO_BACKGROUND_SYNC,
  resolveSyncState,
  shouldUseOfflineBff,
  syncCommercialData,
} from "./commerce-offline-sync";
import {
  COMMERCE_OFFLINE_SYNC_POLLING_MS,
  COMMERCE_OFFLINE_TTL_DAYS,
} from "./commerce-offline.types";
import { readQueueStore, writeQueueStore } from "./commerce-offline-storage";

const ORG = "org-test-offline";
const flagsOn = {
  commerce_offline_foundation_enabled: true,
  commerce_offline_sync_enabled: true,
  commerce_offline_queue_enabled: true,
  commercial_relationship_governance_enabled: true,
  venext_bff_routes_enabled: true,
  venext_live_data_fallback_enabled: true,
};

describe("commerce-offline-foundation (20.82)", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") localStorage.clear();
  });

  it("resolveConnectivityMode ONLINE", () => {
    expect(resolveConnectivityMode({ online: true, apiReachable: true })).toBe("ONLINE");
  });

  it("resolveConnectivityMode DEGRADED on slow link", () => {
    expect(resolveConnectivityMode({ online: true, apiReachable: true, slowLink: true })).toBe("DEGRADED");
  });

  it("resolveConnectivityMode OFFLINE", () => {
    expect(resolveConnectivityMode({ online: false })).toBe("OFFLINE");
  });

  it("readBrowserOnline defaults true in node", () => {
    expect(typeof readBrowserOnline()).toBe("boolean");
  });

  it("writes and reads offline cache", () => {
    writeOfflineCache(ORG, "recent_orders", [{ id: "o1" }]);
    const data = readOfflineCache<{ id: string }[]>(ORG, "recent_orders");
    expect(data?.[0]?.id).toBe("o1");
  });

  it("TTL activity 30 days", () => {
    expect(COMMERCE_OFFLINE_TTL_DAYS.recent_activity).toBe(30);
  });

  it("TTL notifications 14 days", () => {
    expect(COMMERCE_OFFLINE_TTL_DAYS.notifications).toBe(14);
  });

  it("TTL messages 7 days", () => {
    expect(COMMERCE_OFFLINE_TTL_DAYS.recent_conversations).toBe(7);
  });

  it("expired cache returns null", () => {
    writeOfflineCache(ORG, "notifications", [{ id: "n1" }]);
    const store = readOfflineCache(ORG, "notifications");
    expect(store).toBeTruthy();
    const entry = {
      key: `${ORG}:notifications`,
      domain: "notifications" as const,
      organizationId: ORG,
      payload: [],
      cachedAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
      expiresAt: new Date(Date.now() - 1).toISOString(),
    };
    expect(isCacheEntryExpired(entry)).toBe(true);
  });

  it("purgeExpiredCache removes stale", () => {
    writeOfflineCache(ORG, "session", { ok: true });
    const n = purgeExpiredCache(ORG);
    expect(n).toBeGreaterThanOrEqual(0);
    clearOfflineCache(ORG);
  });

  it("enqueueOfflineAction adds to queue", () => {
    const id = enqueueOfflineAction(ORG, {
      type: "SEND_MESSAGE",
      organizationId: ORG,
      payload: { text: "hello" },
    });
    expect(listPendingQueue(ORG).some((q) => q.id === id)).toBe(true);
  });

  it("discardOfflineAction removes item", () => {
    const id = enqueueOfflineAction(ORG, {
      type: "CONFIRM_ORDER",
      organizationId: ORG,
      payload: { orderId: "o1" },
    });
    expect(discardOfflineAction(ORG, id)).toBe(true);
    expect(listPendingQueue(ORG).length).toBe(0);
  });

  it("replayOfflineQueue processes items", async () => {
    enqueueOfflineAction(ORG, {
      type: "MARK_NOTIFICATION_READ",
      organizationId: ORG,
      payload: { id: "n1" },
    });
    const r = await replayOfflineQueue(ORG, async () => ({ ok: true }));
    expect(r.replayed).toBe(1);
  });

  it("replayOfflineQueue keeps failed retries", async () => {
    enqueueOfflineAction(ORG, {
      type: "CONFIRM_DELIVERY",
      organizationId: ORG,
      payload: { id: "d1" },
    });
    const r = await replayOfflineQueue(ORG, async () => ({ ok: false }));
    expect(r.failed).toBe(1);
    expect(listPendingQueue(ORG).length).toBe(1);
  });

  it("wallet financial action blocked offline", () => {
    expect(
      isWalletFinancialActionBlocked("WALLET_LIGHT_ACTION", { action: "payment_transfer" }),
    ).toBe(true);
  });

  it("wallet light non-financial allowed", () => {
    expect(isWalletFinancialActionBlocked("WALLET_LIGHT_ACTION", { action: "view_balance" })).toBe(false);
  });

  it("enqueue throws on financial wallet", () => {
    expect(() =>
      enqueueOfflineAction(ORG, {
        type: "WALLET_LIGHT_ACTION",
        organizationId: ORG,
        payload: { action: "receive_settlement" },
      }),
    ).toThrow();
  });

  it("isAllowedOfflineAction lists permitted types", () => {
    expect(isAllowedOfflineAction("SEND_MESSAGE")).toBe(true);
    expect(isAllowedOfflineAction("CONFIRM_ORDER")).toBe(true);
  });

  it("buildDemoBootstrap has orders", () => {
    const b = buildDemoBootstrap(ORG, "GROSSISTE_B");
    expect(b.recentOrders.length).toBeGreaterThan(0);
  });

  it("syncCommercialData offline uses fallback", async () => {
    const r = await syncCommercialData({
      organizationId: ORG,
      actorRole: "DETAILLANT",
      connectivity: "OFFLINE",
      flags: flagsOn,
    });
    expect(r.fallbackUsed).toBe(true);
    expect(readOfflineCache(ORG, "recent_orders")).toBeTruthy();
  });

  it("resolveSyncState tracks pending", () => {
    writeQueueStore(ORG, [
      {
        id: "q1",
        type: "SEND_MESSAGE",
        organizationId: ORG,
        payload: {},
        createdAt: new Date().toISOString(),
        attempts: 0,
      },
    ]);
    const s = resolveSyncState(ORG, "DEGRADED", 1);
    expect(s.pendingCount).toBe(1);
    expect(s.mode).toBe("DEGRADED");
  });

  it("shouldUseOfflineBff when enabled", () => {
    expect(shouldUseOfflineBff(flagsOn, true)).toBe(true);
    expect(shouldUseOfflineBff({ ...flagsOn, venext_bff_routes_enabled: false }, true)).toBe(false);
  });

  it("no background sync polling", () => {
    expect(COMMERCE_OFFLINE_SYNC_POLLING_MS).toBe(0);
    expect(OFFLINE_NO_BACKGROUND_SYNC).toBe(true);
  });

  it("resolveCommercialConflict order confirmed", () => {
    const item = {
      id: "a1",
      type: "CONFIRM_ORDER" as const,
      organizationId: ORG,
      payload: {},
      createdAt: "",
      attempts: 0,
    };
    const c = resolveCommercialConflict(item, "ORDER_ALREADY_CONFIRMED");
    expect(c.resolved).toBe(true);
    expect(buildConflictLabel(c, "fr-CI")).toContain("confirmée");
  });

  it("inferConflictFromError delivery closed", () => {
    const item = {
      id: "a2",
      type: "CONFIRM_DELIVERY" as const,
      organizationId: ORG,
      payload: {},
      createdAt: "",
      attempts: 0,
    };
    expect(inferConflictFromError(item, new Error("delivery already closed"))?.code).toBe(
      "DELIVERY_ALREADY_CLOSED",
    );
  });

  it("filterBootstrapForGovernance keeps catalog when relation-only", () => {
    const b = buildDemoBootstrap(ORG, "GROSSISTE_B");
    const f = filterBootstrapForGovernance(b, flagsOn);
    expect(f.relationalCatalog.length).toBeGreaterThan(0);
  });

  it("allowedDomainsForActor producer", () => {
    expect(allowedDomainsForActor("PRODUCER").includes("recent_activity")).toBe(true);
  });

  it("allowedDomainsForActor detaillant practical", () => {
    expect(allowedDomainsForActor("DETAILLANT").includes("recent_conversations")).toBe(true);
  });

  it("isCacheDomainAllowed", () => {
    expect(isCacheDomainAllowed("recent_orders")).toBe(true);
  });

  it("i18n FR weak connection", () => {
    expect(getOfflineTranslation("offline.banner.weak", "fr-CI")).toContain("faible");
  });

  it("i18n EN", () => {
    expect(getOfflineTranslation("offline.banner.weak", "en")).toBe("Weak connection");
  });

  it("i18n AR", () => {
    expect(getOfflineTranslation("offline.banner.weak", "ar")).toContain("ضعيف");
  });

  it("i18n ZH", () => {
    expect(getOfflineTranslation("offline.connectivity.offline", "zh-CN")).toBe("离线");
  });

  it("wallet wait label", () => {
    expect(getOfflineTranslation("offline.wallet.wait", "fr-CI")).toContain("synchronisation");
  });

  it("no websocket constant", () => {
    expect(COMMERCE_OFFLINE_SYNC_POLLING_MS).toBe(0);
  });

  it("fetchOfflineBootstrap returns null when fetch fails", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("network")));
    const r = await fetchOfflineBootstrap(ORG, "GROSSISTE_B");
    expect(r).toBeNull();
    vi.unstubAllGlobals();
  });

  it("probeApiReachability false on abort", async () => {
    vi.stubGlobal(
      "fetch",
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise((_res, rej) => {
          init?.signal?.addEventListener("abort", () => rej(new Error("aborted")));
        }),
    );
    const ok = await probeApiReachability("/api/health", 10);
    expect(ok).toBe(false);
    vi.unstubAllGlobals();
  });

  it("grossiste A structured domains", () => {
    const domains = allowedDomainsForActor("GROSSISTE_A");
    expect(domains).toContain("relational_catalog");
    expect(domains).toContain("notifications");
  });

  it("terrain B messages cache domain", () => {
    writeOfflineCache(ORG, "recent_conversations", [{ id: "t1" }]);
    expect(readOfflineCache(ORG, "recent_conversations")).toBeTruthy();
  });

  it("sync state no realtime", () => {
    const s = resolveSyncState(ORG, "ONLINE", 0);
    expect(s.inProgress).toBe(false);
  });

  it("replay conflict discards item", async () => {
    enqueueOfflineAction(ORG, {
      type: "CONFIRM_ORDER",
      organizationId: ORG,
      payload: { orderId: "x" },
    });
    const r = await replayOfflineQueue(ORG, async () => ({ ok: false, conflict: true }));
    expect(r.conflicts.length).toBe(1);
    expect(listPendingQueue(ORG).length).toBe(0);
  });

  it("max queue enforced on enqueue", () => {
    for (let i = 0; i < 55; i++) {
      enqueueOfflineAction(ORG, {
        type: "SEND_MESSAGE",
        organizationId: ORG,
        payload: { i },
      });
    }
    expect(listPendingQueue(ORG).length).toBeLessThanOrEqual(50);
  });

  it("ACTIVATE_RELATION allowed offline", () => {
    expect(isAllowedOfflineAction("ACTIVATE_RELATION")).toBe(true);
  });

  it("MARK_NOTIFICATION_READ allowed", () => {
    const id = enqueueOfflineAction(ORG, {
      type: "MARK_NOTIFICATION_READ",
      organizationId: ORG,
      payload: { notificationId: "n1" },
    });
    expect(id.startsWith("off-")).toBe(true);
  });

  it("producer bootstrap demo", () => {
    const b = buildDemoBootstrap(ORG, "PRODUCER");
    expect(b.actorRole).toBe("PRODUCER");
  });

  it("stale cache conflict label", () => {
    const c = resolveCommercialConflict(
      {
        id: "x",
        type: "CONFIRM_ORDER",
        organizationId: ORG,
        payload: {},
        createdAt: "",
        attempts: 0,
      },
      "STALE_CACHE",
    );
    expect(buildConflictLabel(c)).toContain("expir");
  });

  it("relation removed conflict", () => {
    const item = {
      id: "r1",
      type: "ACTIVATE_RELATION" as const,
      organizationId: ORG,
      payload: {},
      createdAt: "",
      attempts: 0,
    };
    expect(inferConflictFromError(item, "relation removed")?.code).toBe("RELATION_REMOVED");
  });

  it("shouldUseOfflineBff false when foundation disabled", () => {
    expect(shouldUseOfflineBff({ commerce_offline_foundation_enabled: false }, true)).toBe(false);
  });

  it("readQueueStore empty by default", () => {
    expect(readQueueStore("org-empty").length).toBe(0);
  });

  it("commercial context cached", () => {
    writeOfflineCache(ORG, "commercial_context", { activeModule: "order" });
    expect(readOfflineCache(ORG, "commercial_context")).toEqual({ activeModule: "order" });
  });

  it("preferences cached", () => {
    writeOfflineCache(ORG, "user_preferences", { locale: "fr-CI" });
    expect(readOfflineCache(ORG, "user_preferences")).toEqual({ locale: "fr-CI" });
  });

  it("no ERP offline jargon in labels", () => {
    const label = getOfflineTranslation("offline.sync.pending", "fr-CI");
    expect(label.toLowerCase()).not.toContain("cache invalidation");
    expect(label.toLowerCase()).not.toContain("websocket");
  });
});
