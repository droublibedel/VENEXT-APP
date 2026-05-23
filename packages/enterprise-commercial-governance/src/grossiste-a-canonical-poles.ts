/**
 * Pôles métier officiels Grossiste A — Instructions 20.86-C / 20.86-E (7 pôles).
 */
export type GrossisteACanonicalPole =
  | "PILOTAGE_COMMERCIAL"
  | "RESEAU_DISTRIBUTION"
  | "COMMANDES_ADV"
  | "LIVRAISON_RECEPTION"
  | "FINANCE_REGLEMENTS"
  | "RELATIONS_PARTENAIRES"
  | "SECURITE_GOUVERNANCE";

/** @deprecated Alias 20.86-C — normalisé vers 20.86-E */
export type LegacyGrossisteAPole =
  | "DIRECTION_COMMERCIALE"
  | "LIVRAISON_DISTRIBUTION"
  | "TERRITOIRE_ACTIVITE";

export type ProducerOnlyPole =
  | "PRODUCTION"
  | "USINE"
  | "SECURITE_INDUSTRIELLE"
  | "DATA_INTELLIGENCE_GLOBALE"
  | "PILOTAGE_INDUSTRIEL"
  | "PREVISION_INDUSTRIELLE"
  | "ANALYSE_MACRO_ECONOMIQUE";

export const GROSSISTE_A_CANONICAL_POLES: readonly GrossisteACanonicalPole[] = [
  "PILOTAGE_COMMERCIAL",
  "RESEAU_DISTRIBUTION",
  "COMMANDES_ADV",
  "LIVRAISON_RECEPTION",
  "FINANCE_REGLEMENTS",
  "RELATIONS_PARTENAIRES",
  "SECURITE_GOUVERNANCE",
] as const;

const LEGACY_POLE_ALIASES: Record<string, GrossisteACanonicalPole> = {
  DIRECTION_COMMERCIALE: "PILOTAGE_COMMERCIAL",
  LIVRAISON_DISTRIBUTION: "LIVRAISON_RECEPTION",
  TERRITOIRE_ACTIVITE: "RESEAU_DISTRIBUTION",
};

export const GROSSISTE_A_POLE_SLUGS: Record<GrossisteACanonicalPole, string> = {
  PILOTAGE_COMMERCIAL: "pilotage-commercial",
  RESEAU_DISTRIBUTION: "reseau-distribution",
  COMMANDES_ADV: "commandes-adv",
  LIVRAISON_RECEPTION: "livraison-reception",
  FINANCE_REGLEMENTS: "finance-reglements",
  RELATIONS_PARTENAIRES: "relations-partenaires",
  SECURITE_GOUVERNANCE: "securite-gouvernance",
};

export const PRODUCER_ONLY_POLES: readonly ProducerOnlyPole[] = [
  "PRODUCTION",
  "USINE",
  "SECURITE_INDUSTRIELLE",
  "DATA_INTELLIGENCE_GLOBALE",
  "PILOTAGE_INDUSTRIEL",
  "PREVISION_INDUSTRIELLE",
  "ANALYSE_MACRO_ECONOMIQUE",
] as const;

export const PRODUCER_ONLY_VENEXT_POLE_IDS = [
  "data-intelligence-workspace",
  "industrial-security",
  "executive",
  "supply-logistics-workspace",
  "marketing-activation-workspace",
] as const;

export const GROSSISTE_A_ALLOWED_VENEXT_POLE_IDS = [
  "commercial",
  "relational-commercial",
  "professional-commercial-network-workspace",
  "order-fulfillment",
  "producer-commercial-mail-workspace",
  "catalog-products",
  "territory-distribution",
  "finance-collections-workspace",
] as const;

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
  | "network-activity"
  | "intelligence"
  | "governance";

export const GROSSISTE_A_WORKSPACE_TO_POLE: Record<GrossisteAWorkspaceId, GrossisteACanonicalPole> = {
  overview: "PILOTAGE_COMMERCIAL",
  intelligence: "PILOTAGE_COMMERCIAL",
  "network-activity": "PILOTAGE_COMMERCIAL",
  network: "RESEAU_DISTRIBUTION",
  catalog: "RESEAU_DISTRIBUTION",
  territory: "RESEAU_DISTRIBUTION",
  orders: "COMMANDES_ADV",
  distribution: "LIVRAISON_RECEPTION",
  finance: "FINANCE_REGLEMENTS",
  "commerce-wallet": "FINANCE_REGLEMENTS",
  "commerce-messaging": "RELATIONS_PARTENAIRES",
  governance: "SECURITE_GOUVERNANCE",
};

export function normalizeGrossisteAPoleKey(pole: string): GrossisteACanonicalPole | null {
  const u = pole.trim().toUpperCase().replace(/-/g, "_");
  if ((GROSSISTE_A_CANONICAL_POLES as readonly string[]).includes(u)) {
    return u as GrossisteACanonicalPole;
  }
  return LEGACY_POLE_ALIASES[u] ?? null;
}

export function isGrossisteACanonicalPole(pole: string): pole is GrossisteACanonicalPole {
  return normalizeGrossisteAPoleKey(pole) !== null;
}

export function isProducerOnlyPole(pole: string): pole is ProducerOnlyPole {
  const u = pole.trim().toUpperCase().replace(/-/g, "_");
  if ((PRODUCER_ONLY_POLES as readonly string[]).includes(u)) return true;
  const slug = pole.trim().toLowerCase();
  return (PRODUCER_ONLY_VENEXT_POLE_IDS as readonly string[]).includes(slug);
}

export function isGrossisteAAllowedVenextPoleId(poleId: string): boolean {
  return (GROSSISTE_A_ALLOWED_VENEXT_POLE_IDS as readonly string[]).includes(poleId);
}

export function poleForGrossisteAWorkspace(workspace: string): GrossisteACanonicalPole | null {
  return GROSSISTE_A_WORKSPACE_TO_POLE[workspace as GrossisteAWorkspaceId] ?? null;
}

export function poleSlugForBusinessPole(pole: GrossisteACanonicalPole): string {
  return GROSSISTE_A_POLE_SLUGS[pole];
}
