/**
 * Instruction 20.45 — producer pole navigation (6 pôles terrain).
 */

export type ProducerPoleId =
  | "executive"
  | "commercial"
  | "relational-commercial"
  | "professional-commercial-network-workspace"
  | "order-fulfillment"
  | "producer-commercial-mail-workspace"
  | "catalog-products"
  | "territory-distribution"
  | "marketing-activation-workspace"
  | "supply-logistics-workspace"
  | "finance-collections-workspace"
  | "data-intelligence-workspace";

export type ProducerPoleNavItem = {
  id: ProducerPoleId;
  label: string;
  shortLabel: string;
  description: string;
  icon?: "network" | "fulfillment" | "catalog" | "territory" | "activation" | "supply" | "finance" | "intelligence";
};

export const PRODUCER_POLE_NAV: readonly ProducerPoleNavItem[] = [
  {
    id: "executive",
    label: "Direction & Stratégie",
    shortLabel: "Direction",
    description: "Stabilité réseau, corridors critiques, résilience.",
  },
  {
    id: "commercial",
    label: "Commercial & Réseau",
    shortLabel: "Commercial",
    description: "Grossistes, zones actives, croissance réseau.",
  },
  {
    id: "relational-commercial",
    label: "Réseau Commercial",
    shortLabel: "Réseau",
    description: "Supervision partenaires, commandes, corridors et territoires.",
    icon: "network",
  },
  {
    id: "professional-commercial-network-workspace",
    label: "Réseau B2B Partenaires",
    shortLabel: "B2B formel",
    description: "Relations producteur ↔ grossiste A — invitations, validation, catalogues fermés.",
    icon: "network",
  },
  {
    id: "order-fulfillment",
    label: "Commandes & Fulfillment",
    shortLabel: "Exécution",
    description: "Commandes, livraisons, incidents et preuves terrain.",
    icon: "fulfillment",
  },
  {
    id: "producer-commercial-mail-workspace",
    label: "Boîte Mail Réseau",
    shortLabel: "Mail réseau",
    description: "Échanges commerciaux professionnels, documents, commandes et règlements liés.",
    icon: "network",
  },
  {
    id: "catalog-products",
    label: "Catalogue & Produits",
    shortLabel: "Catalogue",
    description: "Performance produits, demande, rotation et couverture terrain.",
    icon: "catalog",
  },
  {
    id: "territory-distribution",
    label: "Territoires & Distribution",
    shortLabel: "Territoires",
    description: "Corridors actifs, couverture réseau et dynamique distributeurs.",
    icon: "territory",
  },
  {
    id: "marketing-activation-workspace",
    label: "Marketing & Activation",
    shortLabel: "Marketing",
    description: "Activations terrain, momentum produits et dynamique distributeurs.",
    icon: "activation",
  },
  {
    id: "supply-logistics-workspace",
    label: "Supply & Logistique",
    shortLabel: "Supply",
    description: "Flux logistiques, hubs actifs, corridors et tensions livraison.",
    icon: "supply",
  },
  {
    id: "finance-collections-workspace",
    label: "Finance & Encaissements",
    shortLabel: "Finance",
    description: "Encaissements, stabilité partenaires et risques réseau.",
    icon: "finance",
  },
  {
    id: "data-intelligence-workspace",
    label: "Data & Intelligence",
    shortLabel: "Intelligence",
    description: "Signaux utiles, suggestions terrain et présence discrète VENEXT.",
    icon: "intelligence",
  },
] as const;

export const DEFAULT_PRODUCER_POLE: ProducerPoleId = "executive";

export function isProducerPoleId(value: string): value is ProducerPoleId {
  return PRODUCER_POLE_NAV.some((p) => p.id === value);
}
