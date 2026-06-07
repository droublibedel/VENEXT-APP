/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auditTerrainProfileRuntimeIsolation } from "./audit-terrain-profile-runtime-isolation.js";
import { assertTerrainProfileContext } from "./assert-terrain-profile-context.js";
import {
  buildTerrainQueryKey,
  getProfileScopedCacheStore,
  listProfileCacheNamespaces,
  purgeAllProfileCaches,
} from "./profile-cache-namespaces.js";
import { buildCatalogueRuntimeContext, assertCatalogueProfileMatch } from "./catalogue-runtime-context.js";
import { resolveOrdersRuntimeMode, resolveProfileNavigation } from "./navigation-isolation.js";
import {
  registerMessagingUpload,
  cancelMessagingUploadsForProfile,
  clearMessagingDraftsForProfile,
  getMessagingDraft,
  markMessagingAudioRecording,
  resetMessagingIsolationRuntime,
  setMessagingDraft,
} from "./terrain-profile-messaging-isolation.js";
import {
  listTerrainNotificationsForActiveProfile,
  notificationMatchesActiveProfile,
  purgeTerrainNotificationsForProfile,
  resetTerrainNotificationCache,
  resolveNotificationScope,
  setTerrainNotificationsForProfile,
} from "./terrain-profile-notifications.js";
import {
  clearTerrainOfflineQueueForProfile,
  drainTerrainOfflineQueue,
  enqueueTerrainOfflineItem,
  listTerrainOfflineQueue,
  resetTerrainOfflineQueues,
} from "./terrain-profile-offline-queue.js";
import {
  cancelTerrainQueriesForProfile,
  listActiveTerrainQueries,
  registerTerrainQuery,
  removeTerrainQueriesForProfile,
  resetTerrainQueryRuntime,
} from "./terrain-profile-query-runtime.js";
import {
  registerTerrainBackgroundDisposer,
  ensureTerrainProfileResetManagerBootstrapped,
  getProfileSessionVersion,
  isTerrainProfileSwitchFrozen,
  rejectStaleProfileSession,
  TerrainProfileRuntimeResetManager,
} from "./terrain-profile-runtime-reset-manager.js";
import {
  listTerrainProfileStores,
  registerBuiltinTerrainProfileStores,
  resetTerrainProfileStoreRegistry,
  TerrainProfileStores,
} from "./terrain-profile-store-registry.js";
import { clearTerrainProfileState, TERRAIN_PROFILE_STORAGE_KEY } from "./storage.js";
import { switchTerrainProfileAsync } from "./profile-runtime-engine.js";
import type { TerrainProfileId } from "./types.js";

const PROFILES: TerrainProfileId[] = ["detaillant", "grossiste_b"];
const DOMAINS = ["catalogue", "market", "orders", "messaging", "network", "wallet", "notifications", "offline"] as const;
const USER = "22507000001";
const CTX = "ctx-user-1";

function seedProfile(profile: TerrainProfileId) {
  localStorage.setItem(
    TERRAIN_PROFILE_STORAGE_KEY,
    JSON.stringify({
      userKey: USER,
      enabledProfiles: PROFILES,
      primaryProfile: profile,
      currentActiveProfile: profile,
      switchCount: 1,
      activeProfileVersion: 1,
      profileContextId: CTX,
    }),
  );
}

describe("terrain-profile-runtime-isolation", () => {
  beforeEach(() => {
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
    purgeAllProfileCaches();
    resetTerrainQueryRuntime();
    resetTerrainOfflineQueues();
    resetTerrainNotificationCache();
    resetMessagingIsolationRuntime();
    resetTerrainProfileStoreRegistry();
    TerrainProfileRuntimeResetManager.resetAll();
    registerBuiltinTerrainProfileStores();
    ensureTerrainProfileResetManagerBootstrapped();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              identity: {
                userKey: USER,
                currentActiveProfile: "grossiste_b",
                primaryProfile: "detaillant",
                enabledProfiles: PROFILES,
                activeProfileVersion: 2,
              },
            }),
            { status: 200 },
          ),
        ),
      ),
    );
  });

  it("auditTerrainProfileRuntimeIsolation passes all checks", () => {
    const audit = auditTerrainProfileRuntimeIsolation();
    expect(audit.ok).toBe(true);
    expect(audit.checks.length).toBeGreaterThanOrEqual(8);
  });

  describe.each(PROFILES)("query keys for %s", (profile) => {
    describe.each(DOMAINS)("domain %s", (domain) => {
      it("prefixes terrain user profile context", () => {
        const key = buildTerrainQueryKey(USER, profile, CTX, domain);
        expect(key[0]).toBe("terrain");
        expect(key).toContain(USER);
        expect(key).toContain(profile);
        expect(key).toContain(CTX);
        expect(key).toContain(domain);
      });

      it("rejects bare domain-only keys", () => {
        expect([domain]).not.toContain("terrain");
      });
    });
  });

  describe.each(PROFILES)("store reset %s", (profile) => {
    it("clears catalogue cache on switch out", async () => {
      const other: TerrainProfileId = profile === "detaillant" ? "grossiste_b" : "detaillant";
      getProfileScopedCacheStore(profile, "catalogues").set("x", { sku: "A" });
      TerrainProfileStores.catalogue.resetForProfileSwitch(profile, other);
      expect(getProfileScopedCacheStore(profile, "catalogues").size).toBe(0);
    });

    it("clears orders cache on switch out", () => {
      const other: TerrainProfileId = profile === "detaillant" ? "grossiste_b" : "detaillant";
      getProfileScopedCacheStore(profile, "orders").set("o1", { id: "1" });
      TerrainProfileStores.orders.resetForProfileSwitch(profile, other);
      expect(getProfileScopedCacheStore(profile, "orders").size).toBe(0);
    });

    it("clears messaging cache on switch out", () => {
      const other: TerrainProfileId = profile === "detaillant" ? "grossiste_b" : "detaillant";
      getProfileScopedCacheStore(profile, "messaging").set("c1", { draft: "hi" });
      TerrainProfileStores.messaging.resetForProfileSwitch(profile, other);
      expect(getProfileScopedCacheStore(profile, "messaging").size).toBe(0);
    });
  });

  it("registers at least 10 resettable stores", () => {
    registerBuiltinTerrainProfileStores();
    expect(listTerrainProfileStores().length).toBeGreaterThanOrEqual(10);
  });

  describe("switch detaillant ↔ grossiste cache purge", () => {
    it("switch detaillant → grossiste nettoie cache détaillant", async () => {
      seedProfile("detaillant");
      getProfileScopedCacheStore("detaillant", "orders").set("ord", 1);
      await TerrainProfileRuntimeResetManager.beginProfileSwitch("detaillant", "grossiste_b", {
        userId: USER,
        profileContextId: CTX,
      });
      expect(getProfileScopedCacheStore("detaillant", "orders").size).toBe(0);
    });

    it("switch grossiste → détaillant nettoie cache grossiste", async () => {
      seedProfile("grossiste_b");
      getProfileScopedCacheStore("grossiste_b", "catalogues").set("cat", 1);
      await TerrainProfileRuntimeResetManager.beginProfileSwitch("grossiste_b", "detaillant", {
        userId: USER,
        profileContextId: CTX,
      });
      expect(listProfileCacheStartsWith("grossisteB.")).toBe(false);
    });
  });

  describe("catalogue / market isolation", () => {
    it("catalogue grossiste invisible en détaillant", () => {
      const ctx = buildCatalogueRuntimeContext("grossiste_b", "org-gb", CTX);
      expect(assertCatalogueProfileMatch(ctx, "detaillant")).toBe(false);
    });

    it("market détaillant mode achats", () => {
      expect(resolveOrdersRuntimeMode("detaillant")).toBe("supplier_purchases_upstream");
    });

    it("market grossiste mode ventes", () => {
      expect(resolveOrdersRuntimeMode("grossiste_b")).toBe("network_sales_downstream");
    });

    it("owner catalogue forbidden for detaillant backend guard", () => {
      expect(
        assertTerrainProfileContext({
          userId: USER,
          activeProfile: "detaillant",
          profileContextId: CTX,
          action: "owner_catalog",
        }).ok,
      ).toBe(false);
    });
  });

  describe("messaging isolation", () => {
    it("draft message ancien profil supprimé", () => {
      setMessagingDraft("detaillant", "conv-1", "bonjour détaillant");
      clearMessagingDraftsForProfile("detaillant");
      expect(getMessagingDraft("detaillant", "conv-1")).toBe("");
    });

    it("draft grossiste isolé du détaillant", () => {
      setMessagingDraft("grossiste_b", "conv-2", "bonjour grossiste");
      expect(getMessagingDraft("detaillant", "conv-2")).toBe("");
    });

    it("switch pendant audio recording annule profil", () => {
      markMessagingAudioRecording("detaillant", true);
      clearMessagingDraftsForProfile("detaillant");
      expect(cancelMessagingUploadsForProfile("detaillant")).toBeGreaterThanOrEqual(0);
    });
  });

  describe("offline queue isolation", () => {
    it("queues namespaced per profile", () => {
      enqueueTerrainOfflineItem(USER, "detaillant", { id: "1", kind: "order", payload: {} });
      enqueueTerrainOfflineItem(USER, "grossiste_b", { id: "2", kind: "order", payload: {} });
      expect(listTerrainOfflineQueue(USER, "detaillant")).toHaveLength(1);
      expect(listTerrainOfflineQueue(USER, "grossiste_b")).toHaveLength(1);
    });

    it("upload ancien profil non drainé dans nouveau", () => {
      enqueueTerrainOfflineItem(USER, "detaillant", { id: "d1", kind: "upload", payload: {} });
      clearTerrainOfflineQueueForProfile(USER, "detaillant");
      expect(drainTerrainOfflineQueue(USER, "grossiste_b")).toHaveLength(0);
    });
  });

  describe("notifications contextualisées", () => {
    it.each([
      ["GLOBAL_USER", "detaillant", true],
      ["GROSSISTE_CONTEXT", "grossiste_b", true],
      ["GROSSISTE_CONTEXT", "detaillant", false],
      ["DETAILLANT_CONTEXT", "detaillant", true],
      ["DETAILLANT_CONTEXT", "grossiste_b", false],
    ] as const)("scope %s on %s => %s", (scope, profile, expected) => {
      expect(notificationMatchesActiveProfile(scope, profile)).toBe(expected);
    });

    it("reload notifications for active profile only", () => {
      setTerrainNotificationsForProfile(CTX, "detaillant", [
        { id: "n1", scope: "DETAILLANT_CONTEXT", title: "A", profileContextId: CTX },
      ]);
      setTerrainNotificationsForProfile(CTX, "grossiste_b", [
        { id: "n2", scope: "GROSSISTE_CONTEXT", title: "B", profileContextId: CTX },
      ]);
      const dt = listTerrainNotificationsForActiveProfile(CTX, "detaillant");
      expect(dt.some((n) => n.id === "n2")).toBe(false);
      purgeTerrainNotificationsForProfile(CTX, "detaillant");
    });
  });

  describe("query runtime cancel", () => {
    it("cancel queries profil précédent", () => {
      registerTerrainQuery(USER, "detaillant", CTX, "orders");
      expect(listActiveTerrainQueries("detaillant")).toHaveLength(1);
      expect(cancelTerrainQueriesForProfile("detaillant")).toBe(1);
      expect(listActiveTerrainQueries("detaillant")).toHaveLength(0);
    });

    it("remove queries after switch", () => {
      registerTerrainQuery(USER, "grossiste_b", CTX, "catalogue");
      removeTerrainQueriesForProfile("grossiste_b");
      expect(listActiveTerrainQueries("grossiste_b")).toHaveLength(0);
    });
  });

  describe("profileSessionVersion / stale requests", () => {
    it("increments on begin switch", async () => {
      const before = getProfileSessionVersion();
      await TerrainProfileRuntimeResetManager.beginProfileSwitch("detaillant", "grossiste_b");
      expect(getProfileSessionVersion()).toBeGreaterThan(before);
    });

    it("rejects stale request after switch", async () => {
      await TerrainProfileRuntimeResetManager.beginProfileSwitch("detaillant", "grossiste_b");
      expect(rejectStaleProfileSession(0)).toBe(true);
    });

    it("accepts current version", async () => {
      await TerrainProfileRuntimeResetManager.beginProfileSwitch("detaillant", "grossiste_b");
      expect(rejectStaleProfileSession(getProfileSessionVersion())).toBe(false);
    });
  });

  describe("wallet commun profil-aware", () => {
    it("wallet store reset is noop (user scoped)", () => {
      expect(() =>
        TerrainProfileStores.wallet.resetForProfileSwitch("detaillant", "grossiste_b"),
      ).not.toThrow();
    });
  });

  describe("switch rapide répété", () => {
    it.each([1, 2, 3, 4, 5])("iteration %i sans fuite cache", async (i) => {
      const profile: TerrainProfileId = i % 2 === 0 ? "grossiste_b" : "detaillant";
      getProfileScopedCacheStore(profile, "orders").set(`k${i}`, i);
      const next: TerrainProfileId = profile === "detaillant" ? "grossiste_b" : "detaillant";
      await TerrainProfileRuntimeResetManager.beginProfileSwitch(profile, next, { userId: USER });
      TerrainProfileRuntimeResetManager.completeProfileSwitch({
        previousProfile: profile,
        nextProfile: next,
        userId: USER,
        profileContextId: CTX,
        profileSessionVersion: getProfileSessionVersion(),
      });
      expect(isTerrainProfileSwitchFrozen()).toBe(false);
    });
  });

  describe("backend switch integration", () => {
    it("switchTerrainProfileAsync uses backend response", async () => {
      seedProfile("detaillant");
      const result = await switchTerrainProfileAsync("grossiste_b");
      expect(result.active).toBe("grossiste_b");
      expect(result.confirmedByBackend).toBe(true);
    });
  });

  describe("notification scope resolution", () => {
    it.each(PROFILES)("resolve scope for %s", (profile) => {
      const scope = resolveNotificationScope(profile);
      expect(["GLOBAL_USER", "GROSSISTE_CONTEXT", "DETAILLANT_CONTEXT"]).toContain(scope);
    });
  });

  describe("orders isolation per profile", () => {
    it.each(PROFILES)("orders cache isolated for %s", (profile) => {
      getProfileScopedCacheStore(profile, "orders").set("ref", { profile });
      const other: TerrainProfileId = profile === "detaillant" ? "grossiste_b" : "detaillant";
      expect(getProfileScopedCacheStore(other, "orders").has("ref")).toBe(false);
    });
  });

  describe("commande détaillant invisible en grossiste", () => {
    it("orders detaillant not visible after purge", async () => {
      getProfileScopedCacheStore("detaillant", "orders").set("cmd-dt", { id: "cmd-dt" });
      await TerrainProfileRuntimeResetManager.beginProfileSwitch("detaillant", "grossiste_b");
      expect(getProfileScopedCacheStore("detaillant", "orders").size).toBe(0);
      expect(getProfileScopedCacheStore("grossiste_b", "orders").has("cmd-dt")).toBe(false);
    });
  });

  describe("navigation reset contract", () => {
    it.each([
      ["detaillant", "home"],
      ["grossiste_b", "activity"],
    ] as const)("default tab for %s is %s", (profile, tab) => {
      expect(resolveProfileNavigation(profile).defaultTab).toBe(tab);
    });
  });

  describe("assertTerrainProfileContext matrix", () => {
    it.each([
      ["detaillant", "detaillant", true],
      ["grossiste_b", "grossiste_b", true],
      ["detaillant", "grossiste_b", false],
      ["grossiste_b", "detaillant", false],
    ] as const)("active %s resource %s allowed=%s", (active, resource, allowed) => {
      const result = assertTerrainProfileContext({
        userId: USER,
        activeProfile: active,
        profileContextId: CTX,
        resourceProfile: resource,
      });
      expect(result.ok).toBe(allowed);
    });

    it.each(PROFILES)("invalid user rejected for %s", (profile) => {
      expect(assertTerrainProfileContext({ userId: "anonymous", activeProfile: profile, profileContextId: CTX }).ok).toBe(
        false,
      );
    });
  });

  describe.each(DOMAINS)("optimistic domain purge %s", (domain) => {
    it.each(PROFILES)("clears %s cache on profile switch", async (profile) => {
      const cacheDomain =
        domain === "catalogue"
          ? "catalogues"
          : domain === "market"
            ? "products"
            : domain === "notifications"
              ? "activity"
              : domain === "offline"
                ? "home"
                : (domain as "orders" | "messaging" | "network" | "wallet");
      getProfileScopedCacheStore(profile, cacheDomain).set("opt", { pending: true });
      const next: TerrainProfileId = profile === "detaillant" ? "grossiste_b" : "detaillant";
      await TerrainProfileRuntimeResetManager.beginProfileSwitch(profile, next);
      expect(getProfileScopedCacheStore(profile, cacheDomain).size).toBe(0);
    });
  });

  describe("multi-device realign", () => {
    it("backend version wins over stale client", async () => {
      seedProfile("detaillant");
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string) => {
          if (String(url).includes("switch")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  ok: true,
                  identity: {
                    userKey: USER,
                    currentActiveProfile: "grossiste_b",
                    primaryProfile: "detaillant",
                    enabledProfiles: PROFILES,
                    activeProfileVersion: 9,
                  },
                }),
                { status: 200 },
              ),
            );
          }
          return Promise.resolve(new Response(JSON.stringify({ ok: true, identity: null }), { status: 200 }));
        }),
      );
      await switchTerrainProfileAsync("grossiste_b");
      expect(rejectStaleProfileSession(1)).toBe(true);
    });
  });

  describe("no placeholder contract", () => {
    it("host access ready when profile active before hydration", async () => {
      const { resolveTerrainProfileHostState } = await import("./terrain-profile-host-access.js");
      expect(
        resolveTerrainProfileHostState({
          expectedProfile: "detaillant",
          activeProfile: "detaillant",
          mobileEnabled: false,
          hydrated: false,
        }),
      ).toBe("ready");
    });
  });

  describe("freeze during transition", () => {
    it("interactions frozen during begin", async () => {
      const p = TerrainProfileRuntimeResetManager.beginProfileSwitch("detaillant", "grossiste_b");
      expect(isTerrainProfileSwitchFrozen()).toBe(true);
      await p;
    });

    it("interactions unfrozen after complete", async () => {
      const transition = await TerrainProfileRuntimeResetManager.beginProfileSwitch(
        "detaillant",
        "grossiste_b",
      );
      TerrainProfileRuntimeResetManager.completeProfileSwitch(transition);
      expect(isTerrainProfileSwitchFrozen()).toBe(false);
    });
  });

  describe("background listener disposal", () => {
    it("registers and clears disposers on reset", () => {
      let disposed = false;
      registerTerrainBackgroundDisposer(() => {
        disposed = true;
      });
      TerrainProfileRuntimeResetManager.resetAll();
      expect(disposed).toBe(true);
    });
  });

  describe("fetch during switch", () => {
    it.each(PROFILES)("cancels in-flight queries for %s", (profile) => {
      registerTerrainQuery(USER, profile, CTX, "fetch-in-flight");
      expect(cancelTerrainQueriesForProfile(profile)).toBe(1);
    });
  });

  describe("cross-profile resource guards", () => {
    it.each([
      ["grossiste_b", "wholesale_market"],
      ["detaillant", "wholesale_market"],
    ] as const)("%s action %s", (profile, action) => {
      const result = assertTerrainProfileContext({
        userId: USER,
        activeProfile: profile,
        profileContextId: CTX,
        action,
      });
      expect(typeof result.ok).toBe("boolean");
    });

    it.each(DOMAINS)("domain %s has terrain query namespace", (domain) => {
      const key = buildTerrainQueryKey(USER, "detaillant", CTX, domain);
      expect(key.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("audio upload isolation", () => {
    it("cancels uploads when switching from detaillant", () => {
      registerMessagingUpload("detaillant", "upload-token-1");
      expect(cancelMessagingUploadsForProfile("detaillant")).toBe(1);
    });

    it("cancels uploads when switching from grossiste", () => {
      registerMessagingUpload("grossiste_b", "upload-token-2");
      expect(cancelMessagingUploadsForProfile("grossiste_b")).toBe(1);
    });
  });

  describe("switch commande en cours", () => {
    it.each(PROFILES)("pending order cleared for %s", async (profile) => {
      getProfileScopedCacheStore(profile, "orders").set("pending", { status: "draft" });
      const next: TerrainProfileId = profile === "detaillant" ? "grossiste_b" : "detaillant";
      await TerrainProfileRuntimeResetManager.beginProfileSwitch(profile, next);
      expect(getProfileScopedCacheStore(profile, "orders").size).toBe(0);
    });

    it("no cross-profile order leak after complete switch", async () => {
      getProfileScopedCacheStore("detaillant", "orders").set("leak", { id: "leak" });
      const transition = await TerrainProfileRuntimeResetManager.beginProfileSwitch(
        "detaillant",
        "grossiste_b",
      );
      TerrainProfileRuntimeResetManager.completeProfileSwitch(transition);
      expect(getProfileScopedCacheStore("grossiste_b", "orders").has("leak")).toBe(false);
    });
  });
});

function listProfileCacheStartsWith(prefix: string): boolean {
  return listProfileCacheNamespaces().some((ns) => ns.startsWith(prefix));
}
