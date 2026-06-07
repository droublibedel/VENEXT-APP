import type { TerrainProfileId } from "./types.js";

export type TerrainCacheDomain =
  | "catalogues"
  | "orders"
  | "network"
  | "activity"
  | "home"
  | "products"
  | "messaging"
  | "wallet"
  | "suggestions";

export function profileCacheNamespace(profile: TerrainProfileId, domain: TerrainCacheDomain): string {
  const prefix = profile === "grossiste_b" ? "grossisteB" : "detaillant";
  return `${prefix}.${domain}`;
}

export function buildProfileScopedCacheKey(
  profile: TerrainProfileId,
  domain: TerrainCacheDomain,
  ...parts: string[]
): string {
  return [profileCacheNamespace(profile, domain), ...parts.filter(Boolean)].join(":");
}

export function buildTerrainQueryKey(
  userId: string,
  activeProfile: TerrainProfileId,
  profileContextId: string,
  ...parts: string[]
): string[] {
  return ["terrain", userId, activeProfile, profileContextId, ...parts.filter(Boolean)];
}

export function buildProfileQueryKey(
  profile: TerrainProfileId,
  profileContextId: string,
  ...parts: string[]
): string[] {
  return buildTerrainQueryKey(profileContextId, profile, profileContextId, ...parts);
}

export function buildProfileStoreKey(
  profile: TerrainProfileId,
  profileContextId: string,
  store: string,
): string {
  return `${profile}:${profileContextId}:${store}`;
}

const namespaceStores = new Map<string, Map<string, unknown>>();

export function getProfileScopedCacheStore(profile: TerrainProfileId, domain: TerrainCacheDomain): Map<string, unknown> {
  const ns = profileCacheNamespace(profile, domain);
  let store = namespaceStores.get(ns);
  if (!store) {
    store = new Map();
    namespaceStores.set(ns, store);
  }
  return store;
}

export function purgeProfileCacheNamespace(
  profile: TerrainProfileId,
  domain?: TerrainCacheDomain,
): void {
  if (domain) {
    namespaceStores.delete(profileCacheNamespace(profile, domain));
    return;
  }
  const prefix = profile === "grossiste_b" ? "grossisteB." : "detaillant.";
  for (const key of [...namespaceStores.keys()]) {
    if (key.startsWith(prefix)) namespaceStores.delete(key);
  }
}

export function purgeAllProfileCaches(): void {
  namespaceStores.clear();
}

export function listProfileCacheNamespaces(): string[] {
  return [...namespaceStores.keys()];
}
