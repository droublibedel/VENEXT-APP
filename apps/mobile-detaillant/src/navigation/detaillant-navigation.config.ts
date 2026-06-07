export type DetaillantBottomTabId = "home" | "products" | "orders" | "network";

export type DetaillantTabId = DetaillantBottomTabId | "messaging" | "account";

export type DetaillantTabConfig = {
  id: DetaillantBottomTabId;
  key: DetaillantBottomTabId;
  label: string;
  icon: "home" | "catalog" | "orders" | "network";
  testId: string;
};

/** Quatre onglets premium — Messagerie & Profil dans le header (VENEXT-MOBILE-NAVIGATION-02). */
export const DETAILLANT_BOTTOM_TABS: DetaillantTabConfig[] = [
  { id: "home", key: "home", label: "Accueil", icon: "home", testId: "detaillant-tab-home" },
  { id: "products", key: "products", label: "Marché", icon: "catalog", testId: "detaillant-tab-products" },
  { id: "orders", key: "orders", label: "Commandes", icon: "orders", testId: "detaillant-tab-orders" },
  { id: "network", key: "network", label: "Réseau", icon: "network", testId: "detaillant-tab-network" },
];

export const DETAILLANT_TAB_TITLES: Record<DetaillantTabId, string> = {
  home: "Accueil",
  products: "Marché",
  orders: "Commandes",
  network: "Réseau",
  messaging: "Messagerie",
  account: "Profil",
};

/** @deprecated Utiliser DETAILLANT_BOTTOM_TABS */
export const DETAILLANT_TABS = DETAILLANT_BOTTOM_TABS;

export function isDetaillantBottomTab(tab: DetaillantTabId): tab is DetaillantBottomTabId {
  return tab === "home" || tab === "products" || tab === "orders" || tab === "network";
}
