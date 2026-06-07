import type { TerrainProfileId } from "./types.js";

export type TerrainNavigationTabId =
  | "activity"
  | "catalog"
  | "home"
  | "products"
  | "orders"
  | "network"
  | "messaging"
  | "account"
  | "profile"
  | "wallet";

export type TerrainProfileNavigationRegistry = {
  profile: TerrainProfileId;
  defaultTab: TerrainNavigationTabId;
  bottomTabs: TerrainNavigationTabId[];
  extendedTabs: TerrainNavigationTabId[];
};

export const TERRAIN_PROFILE_NAVIGATION: Record<TerrainProfileId, TerrainProfileNavigationRegistry> = {
  grossiste_b: {
    profile: "grossiste_b",
    defaultTab: "activity",
    bottomTabs: ["activity", "catalog", "orders", "network"],
    extendedTabs: ["messaging", "profile", "wallet"],
  },
  detaillant: {
    profile: "detaillant",
    defaultTab: "home",
    bottomTabs: ["home", "products", "orders", "network"],
    extendedTabs: ["messaging", "account"],
  },
};

export function resolveProfileNavigation(profile: TerrainProfileId): TerrainProfileNavigationRegistry {
  return TERRAIN_PROFILE_NAVIGATION[profile];
}

export function isNavigationTabAllowed(profile: TerrainProfileId, tabId: string): boolean {
  const registry = TERRAIN_PROFILE_NAVIGATION[profile];
  return (
    registry.bottomTabs.includes(tabId as TerrainNavigationTabId)
    || registry.extendedTabs.includes(tabId as TerrainNavigationTabId)
  );
}

export function assertNavigationProfileMatch(
  profile: TerrainProfileId | null,
  tabId: string,
): { allowed: boolean; reason?: string } {
  if (!profile) return { allowed: false, reason: "no_active_profile" };
  if (!isNavigationTabAllowed(profile, tabId)) {
    return { allowed: false, reason: "tab_not_in_profile" };
  }
  return { allowed: true };
}

export const ORDERS_PROFILE_MODES = {
  grossiste_b: "network_sales_downstream",
  detaillant: "supplier_purchases_upstream",
} as const;

export function resolveOrdersRuntimeMode(profile: TerrainProfileId): string {
  return ORDERS_PROFILE_MODES[profile];
}
