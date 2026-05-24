export type GrossisteBBottomTabId = "activity" | "catalog" | "orders" | "network";

export type GrossisteBTabId = GrossisteBBottomTabId | "messaging" | "profile" | "wallet";

export type GrossisteBTabConfig = {
  id: GrossisteBBottomTabId;
  key: GrossisteBBottomTabId;
  label: string;
  icon: "activity" | "catalog" | "orders" | "network";
  testId: string;
};

/** Quatre onglets premium — Messagerie & Profil dans le header (VENEXT-MOBILE-NAVIGATION-02). */
export const GROSSISTE_B_BOTTOM_TABS: GrossisteBTabConfig[] = [
  { id: "activity", key: "activity", label: "Activité", icon: "activity", testId: "grossiste-tab-activity" },
  { id: "catalog", key: "catalog", label: "Catalogue", icon: "catalog", testId: "grossiste-tab-catalog" },
  { id: "orders", key: "orders", label: "Commandes", icon: "orders", testId: "grossiste-tab-orders" },
  { id: "network", key: "network", label: "Réseau", icon: "network", testId: "grossiste-tab-network" },
];

export const GROSSISTE_B_TAB_TITLES: Record<GrossisteBTabId, string> = {
  activity: "Activité",
  catalog: "Catalogue",
  orders: "Commandes",
  network: "Réseau",
  messaging: "Messagerie",
  profile: "Profil",
  wallet: "Règlements",
};

/** @deprecated Utiliser GROSSISTE_B_BOTTOM_TABS */
export const GROSSISTE_B_TABS = GROSSISTE_B_BOTTOM_TABS;

export function isGrossisteBBottomTab(tab: GrossisteBTabId): tab is GrossisteBBottomTabId {
  return tab === "activity" || tab === "catalog" || tab === "orders" || tab === "network";
}
