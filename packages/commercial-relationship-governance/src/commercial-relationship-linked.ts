import { buildLinkedCommerceRelationshipLabel, buildRelationshipContext } from "./commercial-relationship-intelligence";
import { resolveRelationshipGovernance } from "./commercial-relationship-governance";
import type {
  ActorPair,
  CommercialRelationshipGovernanceFlags,
  CommercialRelationshipLevel,
} from "./commercial-relationship.types";

export function mapSupplierTypeToActorRole(supplierType: string): ActorPair["partner"] {
  const t = supplierType.toLowerCase();
  if (t.includes("producteur")) return "producteur";
  if (t.includes("grossiste_a") || t.includes("grossiste a")) return "grossiste_a";
  if (t.includes("grossiste_b") || t.includes("grossiste b")) return "grossiste_b";
  if (t.includes("detaillant") || t.includes("détaillant")) return "detaillant";
  return "grossiste_b";
}

export type LinkedCommerceRelationshipEnrichment = {
  relationshipType: string;
  communicationMode: string;
  identityMode: string;
  autoAccept: string;
  linkedLabel: string;
  preferMail: boolean;
  preferMessaging: boolean;
};

export function enrichLinkedCommerceContext(
  pair: ActorPair,
  options: {
    level?: CommercialRelationshipLevel;
    flags?: CommercialRelationshipGovernanceFlags;
    corridorLabel?: string;
  } = {},
): LinkedCommerceRelationshipEnrichment {
  const ctx = buildRelationshipContext(pair, options);
  const g = ctx.governance;
  return {
    relationshipType: g.relationshipType,
    communicationMode: g.communicationMode,
    identityMode: g.identityMode,
    autoAccept: g.autoAccept,
    linkedLabel: buildLinkedCommerceRelationshipLabel(ctx),
    preferMail: g.preferMail,
    preferMessaging: g.preferMessaging,
  };
}

export function shouldUseMailForRelationship(
  pair: ActorPair,
  flags?: CommercialRelationshipGovernanceFlags,
): boolean {
  return resolveRelationshipGovernance(pair, { flags }).preferMail;
}
