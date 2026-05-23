export type {
  CommercialActorRole,
  CommercialRelationshipType,
  CommercialRelationshipLevel,
  CommercialRelationshipGovernance,
  CommercialRelationshipGovernanceFlags,
  CommercialRelationshipContext,
  ActorPair,
  RelationshipCommunicationMode,
  RelationshipIdentityMode,
} from "./commercial-relationship.types";

export {
  normalizeActorPair,
  resolveCommercialRelationshipType,
  isRelationshipAllowed,
  isRelationshipConditional,
  relationshipAllowance,
  OFFICIAL_RELATIONSHIP_MATRIX,
} from "./commercial-relationship-matrix";

export {
  isCommercialRelationshipGovernanceEnabled,
  isMultiLevelNetworkEnabled,
  isRelationshipContextEnabled,
  resolveRelationshipGovernance,
  resolveRelationshipIdentityMode,
  resolveAutoAcceptMode,
  canExposeCatalogAcrossRelationship,
  assertNoSocialMarketplaceDrift,
} from "./commercial-relationship-governance";

export {
  sanitizeRelationshipText,
  buildRelationshipContext,
  buildRelationshipHints,
  buildLinkedCommerceRelationshipLabel,
} from "./commercial-relationship-intelligence";

export {
  RELATIONSHIP_SCENARIOS,
  mockRelationshipContextsForActor,
  getScenarioByType,
  getOfficialMatrix,
} from "./commercial-relationship.viewmodel";

export {
  mapSupplierTypeToActorRole,
  enrichLinkedCommerceContext,
  shouldUseMailForRelationship,
} from "./commercial-relationship-linked";
export type { LinkedCommerceRelationshipEnrichment } from "./commercial-relationship-linked";
