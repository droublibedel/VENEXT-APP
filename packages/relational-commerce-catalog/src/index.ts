export { RelationalCommerceCatalogShell } from "./RelationalCommerceCatalogShell";
export { RelationalSupplierCatalog } from "./RelationalSupplierCatalog";
export { RelationalCatalogSection } from "./RelationalCatalogSection";
export { RelationalProductCard } from "./RelationalProductCard";
export { RelationalPartnerHeader } from "./RelationalPartnerHeader";
export { RelationalCatalogVisibility } from "./RelationalCatalogVisibility";
export { RelationalOrderComposer } from "./RelationalOrderComposer";
export { RelationalOrderSummary } from "./RelationalOrderSummary";
export { RelationalCommercialContext } from "./RelationalCommercialContext";
export { RelationalCatalogDiscovery } from "./RelationalCatalogDiscovery";
export { RelationalCatalogEmptyState } from "./RelationalCatalogEmptyState";

export {
  isRelationalCatalogEnabled,
  isSponsoredDiscoveryEnabled,
  isPartnerVisibilityEnabled,
  canViewCatalog,
  isProductVisible,
  filterVisibleCatalogs,
  isFormalActor,
  isTerrainActor,
  assertNoGlobalMarketplaceUi,
} from "./relational-commerce-catalog-governance";
export {
  buildCatalogAccessContext,
  canViewCatalogWithAccessControl,
  canQuickOrderCatalog,
  canBrowseCatalog,
  type CatalogAccessBridgeInput,
} from "./relational-catalog-access-bridge";

export {
  buildRelationalCatalogSignals,
  buildPartnerCatalogHints,
  buildSponsoredDiscoveryHints,
  sanitizeRelationalCommerceText,
} from "./relational-commerce-catalog-intelligence";

export { mockRelationalCatalogView } from "./relational-commerce-catalog.viewmodel";
export { useRelationalCommerceCatalog } from "./useRelationalCommerceCatalog";
export {
  bindCatalogContextRouting,
  type CommercialContextRoutingInput,
} from "./commercial-context-bridge";

export { QuickTerrainPublishFlow, TerrainCatalogGrid } from "./terrain/QuickTerrainPublishFlow";
export { TerrainRelationalProductCard } from "./terrain/TerrainRelationalProductCard";
export { ProductVoiceDescription } from "terrain-commercial-audio";
export { VenextAudioSpeakerButton, buildProductMessagingContext } from "terrain-commercial-audio";
export { dispatchTerrainImages, resolveMultiImageQuestion } from "./terrain/dispatch-multi-images";
export { auditGrossisteBCatalogIntegrity } from "./audit/grossiste-b-catalog-audits";
export type { TerrainProductDraft, MultiImageDispatchMode } from "./terrain/terrain-catalog.types";

export type {
  RelationalActorRole,
  CatalogVisibilityMode,
  CommercialRelationshipLevel,
  RelationalProduct,
  RelationalPartner,
  RelationalCatalog,
  RelationalDiscoveryItem,
  RelationalCommercialContextData,
  RelationalCatalogView,
  RelationalCatalogFlags,
  RelationalCatalogInjected,
  RelationalCatalogShellProps,
  RelationalOrderLine,
} from "./relational-commerce-catalog.types";
