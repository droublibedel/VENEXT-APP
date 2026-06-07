import type { TerrainProfileId } from "./types.js";
import { purgeProfileCacheNamespace, type TerrainCacheDomain } from "./profile-cache-namespaces.js";

export type TerrainProfileStoreResetHandler = {
  name: string;
  domains?: TerrainCacheDomain[];
  resetForProfileSwitch: (
    previousProfile: TerrainProfileId | null,
    nextProfile: TerrainProfileId,
  ) => void;
};

const storeHandlers = new Map<string, TerrainProfileStoreResetHandler>();

const DOMAIN_STORES: TerrainCacheDomain[] = [
  "catalogues",
  "orders",
  "network",
  "activity",
  "home",
  "products",
  "messaging",
  "wallet",
  "suggestions",
];

export function registerTerrainProfileStore(handler: TerrainProfileStoreResetHandler): () => void {
  storeHandlers.set(handler.name, handler);
  return () => storeHandlers.delete(handler.name);
}

export function resetStoresForProfileSwitch(
  previousProfile: TerrainProfileId | null,
  nextProfile: TerrainProfileId,
): string[] {
  const resetNames: string[] = [];
  if (previousProfile && previousProfile !== nextProfile) {
    for (const domain of DOMAIN_STORES) {
      purgeProfileCacheNamespace(previousProfile, domain);
    }
    for (const handler of storeHandlers.values()) {
      handler.resetForProfileSwitch(previousProfile, nextProfile);
      resetNames.push(handler.name);
    }
  }
  return resetNames;
}

export function listTerrainProfileStores(): string[] {
  return [...storeHandlers.keys()];
}

export function resetTerrainProfileStoreRegistry(): void {
  storeHandlers.clear();
}

/** Built-in store facades for audit + tests */
export const TerrainProfileStores = {
  catalogue: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "catalogues");
      purgeProfileCacheNamespace(next, "catalogues");
    },
  },
  market: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "products");
      purgeProfileCacheNamespace(next, "products");
    },
  },
  orders: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "orders");
      purgeProfileCacheNamespace(next, "orders");
    },
  },
  messaging: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "messaging");
      purgeProfileCacheNamespace(next, "messaging");
    },
  },
  network: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "network");
      purgeProfileCacheNamespace(next, "network");
    },
  },
  wallet: {
    resetForProfileSwitch: (_prev: TerrainProfileId | null, _next: TerrainProfileId) => {
      // Wallet = utilisateur commun — pas de purge par profil, permissions recalculées côté host.
    },
  },
  notifications: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "activity");
      purgeProfileCacheNamespace(next, "activity");
    },
  },
  upload: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, _next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "messaging");
    },
  },
  audio: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, _next: TerrainProfileId) => {
      if (prev) purgeProfileCacheNamespace(prev, "messaging");
    },
  },
  offline: {
    resetForProfileSwitch: (prev: TerrainProfileId | null, _next: TerrainProfileId) => {
      if (prev) {
        for (const domain of DOMAIN_STORES) purgeProfileCacheNamespace(prev, domain);
      }
    },
  },
} as const;

export function registerBuiltinTerrainProfileStores(): void {
  for (const [name, store] of Object.entries(TerrainProfileStores)) {
    registerTerrainProfileStore({ name, resetForProfileSwitch: store.resetForProfileSwitch });
  }
}
