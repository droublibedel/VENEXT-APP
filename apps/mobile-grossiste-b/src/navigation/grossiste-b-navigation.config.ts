export type GrossisteBTabId =
  | "activity"
  | "messaging"
  | "wallet"
  | "catalog"
  | "orders"
  | "network"
  | "profile";

export type GrossisteBTabConfig = {
  id: GrossisteBTabId;
  key: GrossisteBTabId;
  label: string;
  icon: string;
  testId: string;
};

/** Six onglets — Messagerie après Activité (Instructions 20.55 + 20.61). */
export const GROSSISTE_B_TABS: GrossisteBTabConfig[] = [
  { id: "activity", key: "activity", label: "Activité", icon: "◉", testId: "grossiste-tab-activity" },
  {
    id: "messaging",
    key: "messaging",
    label: "Messagerie",
    icon: "messages",
    testId: "grossiste-tab-messaging",
  },
  {
    id: "wallet",
    key: "wallet",
    label: "Règlements",
    icon: "wallet",
    testId: "grossiste-tab-wallet",
  },
  { id: "catalog", key: "catalog", label: "Catalogue", icon: "▣", testId: "grossiste-tab-catalog" },
  { id: "orders", key: "orders", label: "Commandes", icon: "☰", testId: "grossiste-tab-orders" },
  { id: "network", key: "network", label: "Réseau", icon: "◎", testId: "grossiste-tab-network" },
  { id: "profile", key: "profile", label: "Profil", icon: "◈", testId: "grossiste-tab-profile" },
];
