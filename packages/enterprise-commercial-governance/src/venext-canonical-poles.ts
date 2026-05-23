import type { VenextCanonicalPole } from "./enterprise-governance.types";

/**
 * Pôles VENEXT existants uniquement (Instruction 20.86-A).
 * Aligné sur `PRODUCER_POLE_NAV` — le client ne peut pas en créer de nouveaux.
 */
export const VENEXT_CANONICAL_POLES: readonly VenextCanonicalPole[] = [
  { poleId: "executive", label: "Direction & Stratégie", shortLabel: "Direction", existingInVenext: true },
  { poleId: "commercial", label: "Commercial & Réseau", shortLabel: "Commercial", existingInVenext: true },
  {
    poleId: "relational-commercial",
    label: "Réseau Commercial",
    shortLabel: "Réseau",
    existingInVenext: true,
  },
  {
    poleId: "professional-commercial-network-workspace",
    label: "Réseau B2B Partenaires",
    shortLabel: "B2B",
    existingInVenext: true,
  },
  {
    poleId: "order-fulfillment",
    label: "Commandes & Fulfillment",
    shortLabel: "Commandes",
    existingInVenext: true,
  },
  {
    poleId: "producer-commercial-mail-workspace",
    label: "Boîte Mail Réseau",
    shortLabel: "Mail",
    existingInVenext: true,
  },
  {
    poleId: "catalog-products",
    label: "Catalogue & Produits",
    shortLabel: "Catalogue",
    existingInVenext: true,
  },
  {
    poleId: "territory-distribution",
    label: "Territoires & Distribution",
    shortLabel: "Territoires",
    existingInVenext: true,
  },
  {
    poleId: "marketing-activation-workspace",
    label: "Marketing & Activation",
    shortLabel: "Marketing",
    existingInVenext: true,
  },
  {
    poleId: "supply-logistics-workspace",
    label: "Supply & Logistique",
    shortLabel: "Supply",
    existingInVenext: true,
  },
  {
    poleId: "finance-collections-workspace",
    label: "Finance & Encaissements",
    shortLabel: "Finance",
    existingInVenext: true,
  },
  {
    poleId: "data-intelligence-workspace",
    label: "Data & Intelligence",
    shortLabel: "Intelligence",
    existingInVenext: true,
  },
  {
    poleId: "industrial-security",
    label: "Sécurité Industrielle",
    shortLabel: "Sécurité",
    existingInVenext: true,
  },
] as const;

export function listVenextCanonicalPoles(): VenextCanonicalPole[] {
  return [...VENEXT_CANONICAL_POLES];
}

export function getVenextCanonicalPole(poleId: string): VenextCanonicalPole | undefined {
  return VENEXT_CANONICAL_POLES.find((p) => p.poleId === poleId);
}

export function assertPoleExistsInVenext(poleId: string): boolean {
  return VENEXT_CANONICAL_POLES.some((p) => p.poleId === poleId);
}

/** Interdit la création dynamique de pôles inconnus */
export function rejectUnknownPoleCreation(poleId: string): void {
  if (!assertPoleExistsInVenext(poleId)) {
    throw new Error("VENEXT_POLE_NOT_IN_PLATFORM");
  }
}
