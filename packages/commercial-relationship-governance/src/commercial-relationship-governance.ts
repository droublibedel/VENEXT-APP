import {
  isRelationshipAllowed,
  isRelationshipConditional,
  resolveCommercialRelationshipType,
} from "./commercial-relationship-matrix";
import type {
  ActorPair,
  CommercialRelationshipGovernance,
  CommercialRelationshipGovernanceFlags,
  CommercialRelationshipLevel,
  CommercialRelationshipType,
  RelationshipIdentityMode,
} from "./commercial-relationship.types";

export function isCommercialRelationshipGovernanceEnabled(
  flags: CommercialRelationshipGovernanceFlags = {},
): boolean {
  return flags.commercial_relationship_governance_enabled !== false;
}

export function isMultiLevelNetworkEnabled(
  flags: CommercialRelationshipGovernanceFlags = {},
): boolean {
  return (
    flags.commercial_multi_level_network_enabled !== false &&
    isCommercialRelationshipGovernanceEnabled(flags)
  );
}

export function isRelationshipContextEnabled(
  flags: CommercialRelationshipGovernanceFlags = {},
): boolean {
  return (
    flags.commercial_relationship_context_enabled !== false &&
    isCommercialRelationshipGovernanceEnabled(flags)
  );
}

function communicationForType(
  type: CommercialRelationshipType,
): CommercialRelationshipGovernance["communicationMode"] {
  switch (type) {
    case "PRODUCTEUR_GROSSISTE_A":
      return "professional-mail";
    case "PRODUCTEUR_GROSSISTE_B":
      return "mail-light-hybrid";
    case "GROSSISTE_A_GROSSISTE_A":
      return "mail-commerce-mix";
    case "GROSSISTE_A_GROSSISTE_B":
      return "formal-terrain-mix";
    case "GROSSISTE_B_GROSSISTE_B":
      return "commerce-messaging";
    case "GROSSISTE_DETAILLANT":
      return "messaging-terrain";
    case "DETAILLANT_DETAILLANT":
      return "messaging-ultra-light";
    case "PRODUCTEUR_DETAILLANT":
      return "mail-light-hybrid";
    case "PRODUCTEUR_PRODUCTEUR":
      return "professional-mail";
    default:
      return "commerce-messaging";
  }
}

export function resolveRelationshipIdentityMode(
  type: CommercialRelationshipType,
  level?: CommercialRelationshipLevel,
): RelationshipIdentityMode {
  if (
    type === "GROSSISTE_B_GROSSISTE_B" ||
    type === "GROSSISTE_DETAILLANT" ||
    type === "DETAILLANT_DETAILLANT"
  ) {
    return "CONTACT_FIRST";
  }
  if (type === "GROSSISTE_A_GROSSISTE_B" || type === "PRODUCTEUR_GROSSISTE_B") {
    return "HYBRID";
  }
  if (level === "CORRIDOR_PARTNER" || level === "NETWORK_EXTENSION") {
    return "HYBRID";
  }
  return "FORMAL";
}

export function resolveAutoAcceptMode(
  type: CommercialRelationshipType,
  level?: CommercialRelationshipLevel,
): CommercialRelationshipGovernance["autoAccept"] {
  if (
    type === "GROSSISTE_B_GROSSISTE_B" ||
    type === "DETAILLANT_DETAILLANT" ||
    type === "GROSSISTE_DETAILLANT"
  ) {
    return "auto";
  }
  if (type === "PRODUCTEUR_GROSSISTE_A" || type === "GROSSISTE_A_GROSSISTE_A") {
    return "manual";
  }
  if (level === "TEMPORARY_SUPPLIER" || level === "LOCAL_SUPPLIER") {
    return "contextual";
  }
  return "contextual";
}

function catalogModeFor(
  type: CommercialRelationshipType,
  level?: CommercialRelationshipLevel,
): CommercialRelationshipGovernance["catalogMode"] {
  if (type === "UNKNOWN") return "hidden";
  if (level === "NETWORK_EXTENSION") return "network-extended";
  if (level === "CORRIDOR_PARTNER") return "sponsored-discovery";
  if (type === "DETAILLANT_DETAILLANT" || type === "GROSSISTE_B_GROSSISTE_B") {
    return "relation-only";
  }
  if (type === "PRODUCTEUR_GROSSISTE_A" || type === "GROSSISTE_A_GROSSISTE_A") {
    return "partner-approved";
  }
  return "relation-only";
}

export function resolveRelationshipGovernance(
  pair: ActorPair,
  options: {
    level?: CommercialRelationshipLevel;
    flags?: CommercialRelationshipGovernanceFlags;
    corridorActive?: boolean;
  } = {},
): CommercialRelationshipGovernance {
  const { level = "RETAIL_PARTNER", flags = {}, corridorActive = false } = options;
  const type = resolveCommercialRelationshipType(pair);
  const allowed = isRelationshipAllowed(pair);
  const conditional = isRelationshipConditional(pair);
  const communicationMode = communicationForType(type);
  const identityMode = resolveRelationshipIdentityMode(type, level);
  const autoAccept = resolveAutoAcceptMode(type, level);

  const terrainUi =
    communicationMode === "messaging-terrain" ||
    communicationMode === "messaging-ultra-light" ||
    communicationMode === "commerce-messaging";

  const formalUi =
    communicationMode === "professional-mail" ||
    communicationMode === "mail-commerce-mix" ||
    identityMode === "FORMAL";

  const multiLevel = isMultiLevelNetworkEnabled(flags);

  return {
    relationshipType: type,
    allowed: allowed && (flags.commercial_relationship_governance_enabled !== false),
    conditional,
    communicationMode,
    identityMode,
    catalogMode: multiLevel ? catalogModeFor(type, level) : "relation-only",
    orderMode: terrainUi ? "terrain-quick" : formalUi ? "formal-network" : "standard",
    settlementMode: terrainUi ? "optional" : formalUi ? "formal-tracked" : "hybrid",
    validationLevel:
      autoAccept === "manual" ? "formal-required" : autoAccept === "auto" ? "none" : "partner",
    autoAccept,
    partnerVisibility: multiLevel && level === "NETWORK_EXTENSION" ? "network-extended" : "partner",
    sponsorshipEnabled: corridorActive || level === "CORRIDOR_PARTNER",
    linkedCommerceEnabled: isRelationshipContextEnabled(flags),
    preferMail:
      communicationMode === "professional-mail" ||
      communicationMode === "mail-light-hybrid" ||
      communicationMode === "mail-commerce-mix",
    preferMessaging:
      communicationMode === "commerce-messaging" ||
      communicationMode === "messaging-terrain" ||
      communicationMode === "messaging-ultra-light",
    terrainUi,
    formalUi,
  };
}

export function canExposeCatalogAcrossRelationship(
  pair: ActorPair,
  flags: CommercialRelationshipGovernanceFlags = {},
): boolean {
  if (!isCommercialRelationshipGovernanceEnabled(flags)) return true;
  const gov = resolveRelationshipGovernance(pair, { flags });
  if (!gov.allowed) return false;
  if (gov.catalogMode === "hidden") return false;
  if (gov.conditional && pair.self === "producteur" && pair.partner === "detaillant") {
    return flags.commercial_multi_level_network_enabled !== false;
  }
  return true;
}

export function assertNoSocialMarketplaceDrift(testId: string | undefined): boolean {
  if (!testId) return true;
  const forbidden = [
    "social-feed",
    "followers",
    "public-marketplace",
    "relationship-graph-visible",
    "supply-chain-org",
  ];
  return !forbidden.some((f) => testId.includes(f));
}
