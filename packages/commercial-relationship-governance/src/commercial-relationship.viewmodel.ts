import { buildRelationshipContext } from "./commercial-relationship-intelligence";
import type {
  ActorPair,
  CommercialActorRole,
  CommercialRelationshipGovernanceFlags,
  CommercialRelationshipLevel,
  CommercialRelationshipType,
} from "./commercial-relationship.types";
import { OFFICIAL_RELATIONSHIP_MATRIX } from "./commercial-relationship-matrix";

export type RelationshipScenario = {
  id: string;
  label: string;
  pair: ActorPair;
  level: CommercialRelationshipLevel;
  corridorLabel?: string;
};

export const RELATIONSHIP_SCENARIOS: RelationshipScenario[] = [
  {
    id: "pa-ga",
    label: "Producteur ↔ Grossiste A",
    pair: { self: "producteur", partner: "grossiste_a" },
    level: "FORMAL_DISTRIBUTOR",
  },
  {
    id: "pb-gb",
    label: "Producteur ↔ Grossiste B",
    pair: { self: "producteur", partner: "grossiste_b" },
    level: "SEMI_WHOLESALE",
  },
  {
    id: "ga-ga",
    label: "Grossiste A ↔ Grossiste A",
    pair: { self: "grossiste_a", partner: "grossiste_a" },
    level: "NETWORK_EXTENSION",
  },
  {
    id: "ga-gb",
    label: "Grossiste A ↔ Grossiste B",
    pair: { self: "grossiste_a", partner: "grossiste_b" },
    level: "CORRIDOR_PARTNER",
    corridorLabel: "Abidjan → Bouaké",
  },
  {
    id: "gb-gb",
    label: "Grossiste B ↔ Grossiste B",
    pair: { self: "grossiste_b", partner: "grossiste_b" },
    level: "TEMPORARY_SUPPLIER",
  },
  {
    id: "g-d",
    label: "Grossiste ↔ Détaillant",
    pair: { self: "grossiste_b", partner: "detaillant" },
    level: "RETAIL_PARTNER",
  },
  {
    id: "d-d",
    label: "Détaillant ↔ Détaillant",
    pair: { self: "detaillant", partner: "detaillant" },
    level: "LOCAL_SUPPLIER",
  },
  {
    id: "p-d",
    label: "Producteur ↔ Détaillant (conditionnel)",
    pair: { self: "producteur", partner: "detaillant" },
    level: "CORRIDOR_PARTNER",
  },
];

export function mockRelationshipContextsForActor(
  role: CommercialActorRole,
  flags: CommercialRelationshipGovernanceFlags = {},
) {
  return RELATIONSHIP_SCENARIOS.filter((s) => s.pair.self === role || s.pair.partner === role).map(
    (s) => buildRelationshipContext(s.pair, { level: s.level, flags, corridorLabel: s.corridorLabel }),
  );
}

export function getScenarioByType(type: CommercialRelationshipType): RelationshipScenario | undefined {
  return RELATIONSHIP_SCENARIOS.find((s) => {
    const ctx = buildRelationshipContext(s.pair);
    return ctx.type === type;
  });
}

export function getOfficialMatrix() {
  return OFFICIAL_RELATIONSHIP_MATRIX;
}
