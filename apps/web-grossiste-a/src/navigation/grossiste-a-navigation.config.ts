export type GrossisteAWorkspaceId =
  | "overview"
  | "network"
  | "commerce-messaging"
  | "commerce-wallet"
  | "orders"
  | "distribution"
  | "catalog"
  | "territory"
  | "finance"
  | "intelligence"
  | "governance";

export type GrossisteANavItem = {
  id: GrossisteAWorkspaceId;
  key: GrossisteAWorkspaceId;
  label: string;
  icon?: string;
  testId: string;
};

/** Nine workspaces — Messagerie after Réseau (Instruction 20.59). */
export const GROSSISTE_A_NAV: GrossisteANavItem[] = [
  { id: "overview", key: "overview", label: "Vue d'ensemble", testId: "ga-nav-overview" },
  { id: "network", key: "network", label: "Réseau Commercial", testId: "ga-nav-network" },
  {
    id: "commerce-messaging",
    key: "commerce-messaging",
    label: "Messagerie",
    icon: "messages",
    testId: "ga-nav-commerce-messaging",
  },
  {
    id: "commerce-wallet",
    key: "commerce-wallet",
    label: "Règlements",
    icon: "wallet",
    testId: "ga-nav-commerce-wallet",
  },
  { id: "orders", key: "orders", label: "Commandes", testId: "ga-nav-orders" },
  { id: "distribution", key: "distribution", label: "Distribution", testId: "ga-nav-distribution" },
  { id: "catalog", key: "catalog", label: "Catalogue", testId: "ga-nav-catalog" },
  { id: "territory", key: "territory", label: "Activité Territoire", testId: "ga-nav-territory" },
  { id: "finance", key: "finance", label: "Finance", testId: "ga-nav-finance" },
  {
    id: "intelligence",
    key: "intelligence",
    label: "Activité réseau",
    testId: "ga-nav-network-activity",
  },
  {
    id: "governance",
    key: "governance",
    label: "Sécurité & gouvernance",
    testId: "ga-nav-governance",
  },
];
