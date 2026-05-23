export { CommercialNetworkDiscoveryShell } from "./CommercialNetworkDiscoveryShell";
export { CommercialContactSuggestions } from "./CommercialContactSuggestions";
export { TerrainPartnerSuggestions } from "./TerrainPartnerSuggestions";
export {
  auditCommerceInvitationAutoAcceptance,
  auditCommerceContactMatchingIntegrity,
} from "./audit/commerce-network-audits";
export { CommercialRelationshipCard } from "./CommercialRelationshipCard";
export { CommercialInstantConnection } from "./CommercialInstantConnection";
export { CommercialContactSyncPanel } from "./CommercialContactSyncPanel";
export { CommercialDiscoveryInsights } from "./CommercialDiscoveryInsights";
export { CommercialPartnerPreview } from "./CommercialPartnerPreview";
export { CommercialCatalogPreview } from "./CommercialCatalogPreview";

export {
  resolveCommercialDiscoveryGovernance,
  isTerrainCommercialRole,
  isFormalCommercialRole,
} from "./commercial-network-discovery-governance";

export {
  resolveTerrainDisplayIdentity,
  maskPhoneNumber,
} from "./identity/resolveTerrainDisplayIdentity";
export { resolveFormalDisplayIdentity } from "./identity/resolveFormalDisplayIdentity";
export {
  applyTerrainIdentityToSuggestion,
  applyTerrainIdentityToView,
  resolveTerrainPartnerDisplayName,
  initialsFromDisplayName,
} from "./identity/applyTerrainDisplayIdentity";
export {
  isContactFirstIdentityEnabled,
  isActivityBasedSuggestionsEnabled,
  shouldUseContactFirstDisplay,
  shouldUseFormalDisplay,
  toCommercialActorType,
  resolveTerrainActorType,
  resolveTerrainIdentityModeForRole,
  isTerrainPseudoIdentityEnabled,
  isTerrainQuickOnboardingEnabled,
} from "./identity/commercial-identity-governance";
export {
  buildIdentityRecognitionHints,
  buildContactDiscoveryHints,
  buildTerrainRelationshipHints,
  buildPseudoIdentityHints,
  buildContactFirstIdentitySignals,
  buildTerrainRegistrationHints,
  sanitizeCommercialIdentityText,
  recognitionReasonToBadge,
} from "./identity/commercial-identity-intelligence";
export {
  mockScenarioFrançoisRetailerView,
  mockScenarioClientYopougonGrossisteView,
  mockScenarioActivityDiscovery,
  mockScenarioFormalProducer,
  mockTerrainIdentitySuggestions,
} from "./identity/commercial-identity-mock-data";

export {
  buildCommercialContactSignals,
  buildCommercialDiscoveryHints,
  buildCommercialRelationshipHints,
  sanitizeCommercialDiscoveryText,
} from "./commercial-network-discovery-intelligence";

export {
  mockCommercialDiscoveryView,
  mockCatalogPreview,
  rankContactSuggestions,
  MOCK_LOCAL_CONTACTS_COUNT,
} from "./commercial-network-discovery-mock-data";

export { useCommercialContactDiscovery, filterVisibleSuggestions } from "./useCommercialContactDiscovery";

export type {
  CommercialActorRole,
  CommercialContactSuggestion,
  CommercialConnectedPartner,
  CommercialCatalogPreviewData,
  CommercialCatalogPreviewItem,
  CommercialDiscoveryView,
  CommercialDiscoveryInjected,
  CommercialDiscoveryShellProps,
  CommercialDiscoveryFlags,
  CommercialDiscoveryGovernance,
  CommercialContactMatchKind,
  CommercialDataSource,
  DisplayIdentityMode,
  RecognitionReason,
} from "./commercial-network-discovery.types";

export type {
  CommercialActorType,
  TerrainIdentityMode,
  TerrainDisplayIdentity,
  FormalDisplayIdentity,
  ResolveTerrainDisplayIdentityInput,
  ResolveFormalDisplayIdentityInput,
  CommercialIdentityFlags,
} from "./identity/commercial-identity.types";
