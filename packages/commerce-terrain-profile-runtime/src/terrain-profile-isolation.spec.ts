/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";

import {
  buildProfileQueryKey,
  buildProfileScopedCacheKey,
  buildProfileStoreKey,
  getProfileScopedCacheStore,
  listProfileCacheNamespaces,
  profileCacheNamespace,
  purgeAllProfileCaches,
  purgeProfileCacheNamespace,
} from "./profile-cache-namespaces.js";
import { buildCatalogueRuntimeContext, assertCatalogueProfileMatch } from "./catalogue-runtime-context.js";
import {
  resolveMessageBusinessContext,
  resolveMessageBusinessBadge,
} from "./message-business-context.js";
import {
  assertNavigationProfileMatch,
  isNavigationTabAllowed,
  resolveOrdersRuntimeMode,
} from "./navigation-isolation.js";
import { assertApiProfileAccess, buildTerrainApiHeaders } from "./terrain-profile-api-headers.js";
import {
  assertProfileResourceAccess,
  getProfileRuntimeContext,
  purgeInactiveProfileCaches,
  registerProfileCachePurgeHandler,
  runProfileIsolationSwitch,
  TerrainProfileIsolationLayer,
} from "./terrain-profile-isolation-layer.js";
import { mergeTerrainProfileFeatureFlags } from "./feature-flags.js";
import { buildTerrainProfileAnalyticsDetail } from "./terrain-profile-analytics.js";
import { clearTerrainProfileState, saveTerrainProfileState, TERRAIN_PROFILE_STORAGE_KEY } from "./storage.js";
import { createEmptyTerrainProfileState } from "./storage.js";

describe("terrain-profile-isolation", () => {
  beforeEach(() => {
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
    purgeAllProfileCaches();
  });

  it("isolates cache namespaces per profile", () => {
    expect(profileCacheNamespace("grossiste_b", "catalogues")).toBe("grossisteB.catalogues");
    expect(profileCacheNamespace("detaillant", "orders")).toBe("detaillant.orders");
    expect(buildProfileScopedCacheKey("grossiste_b", "orders", "org-1")).toBe(
      "grossisteB.orders:org-1",
    );
  });

  it("stores data in separate profile-scoped cache stores", () => {
    getProfileScopedCacheStore("grossiste_b", "catalogues").set("sku-1", { name: "Gros" });
    getProfileScopedCacheStore("detaillant", "catalogues").set("sku-1", { name: "Detail" });
    expect(getProfileScopedCacheStore("grossiste_b", "catalogues").get("sku-1")).toEqual({ name: "Gros" });
    expect(getProfileScopedCacheStore("detaillant", "catalogues").get("sku-1")).toEqual({ name: "Detail" });
    purgeProfileCacheNamespace("grossiste_b");
    expect(getProfileScopedCacheStore("grossiste_b", "catalogues").size).toBe(0);
    expect(getProfileScopedCacheStore("detaillant", "catalogues").size).toBe(1);
  });

  it("builds query and store keys with profile context", () => {
    expect(buildProfileQueryKey("detaillant", "user-42", "catalogues")).toEqual([
      "terrain",
      "user-42",
      "detaillant",
      "user-42",
      "catalogues",
    ]);
    expect(buildProfileStoreKey("grossiste_b", "ctx-1", "nav")).toBe("grossiste_b:ctx-1:nav");
  });

  it("purges inactive profile caches on switch", () => {
    const purged: string[] = [];
    registerProfileCachePurgeHandler((profile) => purged.push(profile));
    getProfileScopedCacheStore("detaillant", "orders").set("x", 1);
    purgeInactiveProfileCaches("grossiste_b");
    expect(purged).toContain("detaillant");
    expect(listProfileCacheNamespaces().some((ns) => ns.startsWith("detaillant."))).toBe(false);
  });

  it("isolates catalogue runtime contexts", () => {
    const ctx = buildCatalogueRuntimeContext("grossiste_b", "org-gb", "ctx-1");
    expect(ctx.mode).toBe("wholesale_distribution");
    expect(assertCatalogueProfileMatch(ctx, "grossiste_b")).toBe(true);
    expect(assertCatalogueProfileMatch(ctx, "detaillant")).toBe(false);
  });

  it("isolates orders runtime modes", () => {
    expect(resolveOrdersRuntimeMode("grossiste_b")).toBe("network_sales_downstream");
    expect(resolveOrdersRuntimeMode("detaillant")).toBe("supplier_purchases_upstream");
  });

  it("enforces navigation tab isolation", () => {
    expect(isNavigationTabAllowed("grossiste_b", "catalog")).toBe(true);
    expect(isNavigationTabAllowed("grossiste_b", "home")).toBe(false);
    expect(assertNavigationProfileMatch("detaillant", "products").allowed).toBe(true);
    expect(assertNavigationProfileMatch("detaillant", "catalog").allowed).toBe(false);
  });

  it("blocks API and resource access on profile mismatch", () => {
    expect(assertApiProfileAccess("detaillant", "grossiste_b").allowed).toBe(false);
    expect(assertProfileResourceAccess("grossiste_b", "detaillant").allowed).toBe(false);
    expect(assertProfileResourceAccess("grossiste_b", "grossiste_b").allowed).toBe(true);
  });

  it("emits terrain API headers for active profile", () => {
    saveTerrainProfileState({
      ...createEmptyTerrainProfileState("22507000001"),
      currentActiveProfile: "detaillant",
      primaryProfile: "detaillant",
      profileSessionId: "venext-terrain-test",
    });
    const headers = buildTerrainApiHeaders();
    expect(headers["X-Venext-Active-Profile"]).toBe("DETAILLANT");
    expect(headers["X-Venext-Profile-Session-Id"]).toBe("venext-terrain-test");
  });

  it("loads feature flags for active profile only", () => {
    const gb = mergeTerrainProfileFeatureFlags({}, "grossiste_b");
    const dt = mergeTerrainProfileFeatureFlags({}, "detaillant");
    expect(gb["grossisteB.messaging.audio.enabled"]).toBe(true);
    expect(dt["detaillant.catalog.discovery.enabled"]).toBe(true);
    expect(gb["detaillant.catalog.discovery.enabled"]).toBeUndefined();
  });

  it("tracks multi-profile analytics", () => {
    saveTerrainProfileState({
      ...createEmptyTerrainProfileState("user-1"),
      primaryProfile: "grossiste_b",
      currentActiveProfile: "detaillant",
      enabledProfiles: ["grossiste_b", "detaillant"],
      switchCount: 2,
    });
    const detail = buildTerrainProfileAnalyticsDetail("terrain_profile_switched", {
      profile: "detaillant",
    });
    expect(detail.activeProfileType).toBe("detaillant");
    expect(detail.crossProfileUsage).toBe(true);
    expect(detail.switchFrequency).toBe(2);
  });

  it("resolves messaging business context", () => {
    expect(resolveMessageBusinessContext("grossiste_b")).toBe("grossiste_distribution");
    expect(resolveMessageBusinessBadge("retailer_procurement", null)).toBe("Détaillant");
  });

  it("runs isolation switch via layer API", () => {
    const events: string[] = [];
    if (typeof window !== "undefined") {
      window.addEventListener("venext:terrain-profile-analytics", ((e: CustomEvent) => {
        events.push(e.detail.event);
      }) as EventListener);
    }
    runProfileIsolationSwitch("grossiste_b", "detaillant");
    expect(events).toContain("terrain_profile_isolation_switch");
    expect(TerrainProfileIsolationLayer.getContext().activeProfile).toBeNull();
  });

  it("exposes runtime context with profile session", () => {
    saveTerrainProfileState({
      ...createEmptyTerrainProfileState("ctx-user"),
      currentActiveProfile: "grossiste_b",
      profileContextId: "ctx-user",
      profileSessionId: "sess-abc",
    });
    const ctx = getProfileRuntimeContext();
    expect(ctx.profileContextId).toBe("ctx-user");
    expect(ctx.profileSessionId).toBe("sess-abc");
    expect(ctx.ordersMode).toBe("network_sales_downstream");
  });
});
