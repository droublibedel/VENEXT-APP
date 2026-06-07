import type { TerrainProfileId } from "./types.js";
import {
  purgeAllProfileCaches,
  purgeProfileCacheNamespace,
  type TerrainCacheDomain,
} from "./profile-cache-namespaces.js";
import { resolveOrdersRuntimeMode } from "./navigation-isolation.js";
import { dispatchTerrainProfileAnalytics } from "./terrain-profile-analytics.js";
import { loadTerrainProfileState } from "./storage.js";
import type { TerrainProfileState } from "./types.js";

export type TerrainProfileRuntimeContext = {
  activeProfile: TerrainProfileId | null;
  primaryProfile: TerrainProfileId | null;
  profileContextId: string;
  profileSessionId: string;
  runtimeContext: "terrain_mobile";
  ordersMode: string | null;
};

type CachePurgeHandler = (profile: TerrainProfileId) => void;

const cachePurgeHandlers = new Set<CachePurgeHandler>();

export function registerProfileCachePurgeHandler(handler: CachePurgeHandler): () => void {
  cachePurgeHandlers.add(handler);
  return () => cachePurgeHandlers.delete(handler);
}

export function getProfileRuntimeContext(state?: TerrainProfileState): TerrainProfileRuntimeContext {
  const resolved = state ?? loadTerrainProfileState();
  const activeProfile = resolved.currentActiveProfile;
  return {
    activeProfile,
    primaryProfile: resolved.primaryProfile,
    profileContextId: resolved.profileContextId ?? resolved.userKey,
    profileSessionId: resolved.profileSessionId ?? "anonymous",
    runtimeContext: "terrain_mobile",
    ordersMode: activeProfile ? resolveOrdersRuntimeMode(activeProfile) : null,
  };
}

export function purgeInactiveProfileCaches(activeProfile: TerrainProfileId): void {
  const inactive: TerrainProfileId = activeProfile === "grossiste_b" ? "detaillant" : "grossiste_b";
  purgeProfileCacheNamespace(inactive);
  for (const handler of cachePurgeHandlers) handler(inactive);
  dispatchTerrainProfileAnalytics("terrain_profile_cache_purged", {
    activeProfile,
    purgedProfile: inactive,
  });
}

export function purgeProfileDomainCache(profile: TerrainProfileId, domain: TerrainCacheDomain): void {
  purgeProfileCacheNamespace(profile, domain);
}

export function runProfileIsolationSwitch(
  previous: TerrainProfileId | null,
  next: TerrainProfileId,
): void {
  if (previous && previous !== next) {
    purgeInactiveProfileCaches(next);
  }
  dispatchTerrainProfileAnalytics("terrain_profile_isolation_switch", {
    previous,
    next,
    activeProfileType: next,
    switchedProfile: next,
    switchFrequency: loadTerrainProfileState().switchCount,
  });
}

export function assertProfileResourceAccess(
  resourceProfile: TerrainProfileId,
  activeProfile: TerrainProfileId | null,
): { allowed: boolean; reason?: string } {
  if (!activeProfile) return { allowed: false, reason: "no_active_profile" };
  if (resourceProfile !== activeProfile) {
    return { allowed: false, reason: "profile_resource_mismatch" };
  }
  return { allowed: true };
}

export function resetTerrainProfileIsolation(): void {
  purgeAllProfileCaches();
  cachePurgeHandlers.clear();
}

/** Central isolation layer — orchestrates profile-scoped runtime boundaries. */
export const TerrainProfileIsolationLayer = {
  getContext: getProfileRuntimeContext,
  registerCachePurge: registerProfileCachePurgeHandler,
  purgeInactive: purgeInactiveProfileCaches,
  purgeDomain: purgeProfileDomainCache,
  onSwitch: runProfileIsolationSwitch,
  assertResourceAccess: assertProfileResourceAccess,
  reset: resetTerrainProfileIsolation,
} as const;
