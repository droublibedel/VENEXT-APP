import type {
  ActorPair,
  CommercialActorRole,
  CommercialRelationshipType,
} from "./commercial-relationship.types";

const ROLE_ORDER: CommercialActorRole[] = [
  "detaillant",
  "grossiste_b",
  "grossiste_a",
  "producteur",
];

export function normalizeActorPair(pair: ActorPair): [CommercialActorRole, CommercialActorRole] {
  const sorted = [pair.self, pair.partner].sort(
    (a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b),
  ) as [CommercialActorRole, CommercialActorRole];
  return sorted;
}

function pairHasRoles(pair: ActorPair, left: CommercialActorRole, right: CommercialActorRole): boolean {
  const roles = new Set([pair.self, pair.partner]);
  return roles.has(left) && roles.has(right);
}

export function resolveCommercialRelationshipType(pair: ActorPair): CommercialRelationshipType {
  if (pair.self === pair.partner) {
    if (pair.self === "producteur") return "PRODUCTEUR_PRODUCTEUR";
    if (pair.self === "grossiste_a") return "GROSSISTE_A_GROSSISTE_A";
    if (pair.self === "grossiste_b") return "GROSSISTE_B_GROSSISTE_B";
    if (pair.self === "detaillant") return "DETAILLANT_DETAILLANT";
    return "UNKNOWN";
  }

  if (pairHasRoles(pair, "producteur", "grossiste_a")) return "PRODUCTEUR_GROSSISTE_A";
  if (pairHasRoles(pair, "producteur", "grossiste_b")) return "PRODUCTEUR_GROSSISTE_B";
  if (pairHasRoles(pair, "producteur", "detaillant")) return "PRODUCTEUR_DETAILLANT";
  if (pairHasRoles(pair, "grossiste_a", "grossiste_b")) return "GROSSISTE_A_GROSSISTE_B";
  if (pairHasRoles(pair, "grossiste_b", "detaillant") || pairHasRoles(pair, "grossiste_a", "detaillant")) {
    return "GROSSISTE_DETAILLANT";
  }

  return "UNKNOWN";
}

export type RelationshipAllowance = "yes" | "conditional" | "optional" | "no";

const ALLOWANCE: Record<CommercialRelationshipType, RelationshipAllowance> = {
  PRODUCTEUR_GROSSISTE_A: "yes",
  PRODUCTEUR_GROSSISTE_B: "yes",
  PRODUCTEUR_DETAILLANT: "conditional",
  PRODUCTEUR_PRODUCTEUR: "optional",
  GROSSISTE_A_GROSSISTE_A: "yes",
  GROSSISTE_A_GROSSISTE_B: "yes",
  GROSSISTE_B_GROSSISTE_B: "yes",
  GROSSISTE_DETAILLANT: "yes",
  DETAILLANT_DETAILLANT: "yes",
  UNKNOWN: "no",
};

export function isRelationshipAllowed(pair: ActorPair): boolean {
  const type = resolveCommercialRelationshipType(pair);
  const allowance = ALLOWANCE[type];
  return allowance === "yes" || allowance === "conditional" || allowance === "optional";
}

export function isRelationshipConditional(pair: ActorPair): boolean {
  return ALLOWANCE[resolveCommercialRelationshipType(pair)] === "conditional";
}

export function relationshipAllowance(pair: ActorPair): RelationshipAllowance {
  return ALLOWANCE[resolveCommercialRelationshipType(pair)];
}

export const OFFICIAL_RELATIONSHIP_MATRIX: {
  type: CommercialRelationshipType;
  allowance: RelationshipAllowance;
  label: string;
}[] = [
  { type: "PRODUCTEUR_GROSSISTE_A", allowance: "yes", label: "Producteur ↔ Grossiste A" },
  { type: "PRODUCTEUR_GROSSISTE_B", allowance: "yes", label: "Producteur ↔ Grossiste B" },
  { type: "GROSSISTE_A_GROSSISTE_A", allowance: "yes", label: "Grossiste A ↔ Grossiste A" },
  { type: "GROSSISTE_A_GROSSISTE_B", allowance: "yes", label: "Grossiste A ↔ Grossiste B" },
  { type: "GROSSISTE_B_GROSSISTE_B", allowance: "yes", label: "Grossiste B ↔ Grossiste B" },
  { type: "GROSSISTE_DETAILLANT", allowance: "yes", label: "Grossiste ↔ Détaillant" },
  { type: "DETAILLANT_DETAILLANT", allowance: "yes", label: "Détaillant ↔ Détaillant" },
  { type: "PRODUCTEUR_DETAILLANT", allowance: "conditional", label: "Producteur ↔ Détaillant" },
  { type: "PRODUCTEUR_PRODUCTEUR", allowance: "optional", label: "Producteur ↔ Producteur" },
];
