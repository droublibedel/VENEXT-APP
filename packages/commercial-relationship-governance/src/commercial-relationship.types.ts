export type CommercialActorRole = "producteur" | "grossiste_a" | "grossiste_b" | "detaillant";

/** Official pairwise relationship key (Instruction 20.75). */
export type CommercialRelationshipType =
  | "PRODUCTEUR_GROSSISTE_A"
  | "PRODUCTEUR_GROSSISTE_B"
  | "PRODUCTEUR_DETAILLANT"
  | "PRODUCTEUR_PRODUCTEUR"
  | "GROSSISTE_A_GROSSISTE_A"
  | "GROSSISTE_A_GROSSISTE_B"
  | "GROSSISTE_B_GROSSISTE_B"
  | "GROSSISTE_DETAILLANT"
  | "DETAILLANT_DETAILLANT"
  | "UNKNOWN";

export type CommercialRelationshipLevel =
  | "FORMAL_DISTRIBUTOR"
  | "SEMI_WHOLESALE"
  | "RETAIL_PARTNER"
  | "TEMPORARY_SUPPLIER"
  | "CORRIDOR_PARTNER"
  | "NETWORK_EXTENSION"
  | "LOCAL_SUPPLIER";

export type RelationshipCommunicationMode =
  | "professional-mail"
  | "mail-light-hybrid"
  | "mail-commerce-mix"
  | "formal-terrain-mix"
  | "commerce-messaging"
  | "messaging-terrain"
  | "messaging-ultra-light";

export type RelationshipIdentityMode = "FORMAL" | "CONTACT_FIRST" | "HYBRID";

export type RelationshipCatalogMode =
  | "relation-only"
  | "partner-approved"
  | "network-extended"
  | "sponsored-discovery"
  | "hidden";

export type RelationshipValidationLevel = "none" | "partner" | "formal-required";

export type RelationshipAutoAcceptMode = "auto" | "manual" | "contextual";

export type CommercialRelationshipGovernanceFlags = {
  commercial_relationship_governance_enabled?: boolean;
  commercial_multi_level_network_enabled?: boolean;
  commercial_relationship_context_enabled?: boolean;
};

export type CommercialRelationshipGovernance = {
  relationshipType: CommercialRelationshipType;
  allowed: boolean;
  conditional: boolean;
  communicationMode: RelationshipCommunicationMode;
  identityMode: RelationshipIdentityMode;
  catalogMode: RelationshipCatalogMode;
  orderMode: "standard" | "terrain-quick" | "formal-network";
  settlementMode: "optional" | "hybrid" | "formal-tracked";
  validationLevel: RelationshipValidationLevel;
  autoAccept: RelationshipAutoAcceptMode;
  partnerVisibility: "closed" | "partner" | "network-extended";
  sponsorshipEnabled: boolean;
  linkedCommerceEnabled: boolean;
  preferMail: boolean;
  preferMessaging: boolean;
  terrainUi: boolean;
  formalUi: boolean;
};

export type CommercialRelationshipContext = {
  type: CommercialRelationshipType;
  level: CommercialRelationshipLevel;
  governance: CommercialRelationshipGovernance;
  corridorLabel?: string;
};

export type ActorPair = {
  self: CommercialActorRole;
  partner: CommercialActorRole;
};
