export type DetaillantTabId = "home" | "messaging" | "products" | "orders" | "network" | "account";

export type DetaillantTabConfig = {
  id: DetaillantTabId;
  key: DetaillantTabId;
  label: string;
  icon: string;
  testId: string;
};

/** Six onglets — Messagerie après Accueil (Instructions 20.56 + 20.62). */
export const DETAILLANT_TABS: DetaillantTabConfig[] = [
  { id: "home", key: "home", label: "Accueil", icon: "⌂", testId: "detaillant-tab-home" },
  {
    id: "messaging",
    key: "messaging",
    label: "Messagerie",
    icon: "messages",
    testId: "detaillant-tab-messaging",
  },
  { id: "products", key: "products", label: "Catalogue", icon: "▣", testId: "detaillant-tab-products" },
  { id: "orders", key: "orders", label: "Commandes", icon: "☰", testId: "detaillant-tab-orders" },
  { id: "network", key: "network", label: "Réseau", icon: "◎", testId: "detaillant-tab-network" },
  { id: "account", key: "account", label: "Profil", icon: "◈", testId: "detaillant-tab-account" },
];
