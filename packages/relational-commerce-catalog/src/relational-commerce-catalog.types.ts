export type RelationalActorRole =
  | "producteur"
  | "grossiste_a"
  | "grossiste_b"
  | "detaillant";

export type CatalogVisibilityMode =
  | "RELATION_ONLY"
  | "PARTNER_APPROVED"
  | "NETWORK_EXTENDED"
  | "SPONSORED_DISCOVERY"
  | "HIDDEN";

export type CommercialRelationshipLevel =
  | "NONE"
  | "CONTACT_DISCOVERED"
  | "INVITED"
  | "APPROVED"
  | "ACTIVE"
  | "PRIORITY_PARTNER";

export type RelationalProduct = {
  id: string;
  name: string;
  priceLabel: string;
  availability: "available" | "limited" | "unavailable";
  category: string;
  badge?: string;
  negotiable?: boolean;
  promoLabel?: string;
  imageUrl?: string;
  voiceDescriptionId?: string;
  voiceDescriptionUrl?: string;
  voiceDurationSec?: number;
};

export type RelationalPartner = {
  id: string;
  displayName: string;
  secondaryName?: string;
  partnerType: string;
  city?: string;
  relationshipLevel: CommercialRelationshipLevel;
  localContactName?: string;
  registeredBusinessName?: string;
};

export type RelationalCatalog = {
  supplierId: string;
  supplierType: string;
  visibilityMode: CatalogVisibilityMode;
  relationshipLevel: CommercialRelationshipLevel;
  products: RelationalProduct[];
  territory?: string[];
  sponsored?: boolean;
  restrictedCatalog?: boolean;
};

export type RelationalDiscoveryItem = {
  id: string;
  label: string;
  hint: string;
  supplierId?: string;
  sponsored?: boolean;
};

export type RelationalCommercialContextData = {
  activePartnerName: string;
  relationshipLabel: string;
  recentOrdersLabel?: string;
  corridor?: string;
  activityLabel?: string;
  settlementLabel?: string;
  networkAvailability?: string;
};

export type RelationalCatalogView = {
  partners: RelationalPartner[];
  catalogs: RelationalCatalog[];
  discoveries: RelationalDiscoveryItem[];
  context: RelationalCommercialContextData;
};

export type RelationalCatalogFlags = {
  relational_catalog_enabled?: boolean;
  sponsored_catalog_discovery_enabled?: boolean;
  partner_catalog_visibility_enabled?: boolean;
  commercial_relationship_governance_enabled?: boolean;
  commercial_multi_level_network_enabled?: boolean;
  commercial_relationship_context_enabled?: boolean;
  commerce_access_control_enabled?: boolean;
  commerce_visibility_guard_enabled?: boolean;
};

export type RelationalCatalogInjected = {
  view: RelationalCatalogView | null;
  loading: boolean;
  error: string | null;
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  onRefresh?: () => void;
};

export type RelationalCatalogShellProps = {
  actorRole: RelationalActorRole;
  enabled?: boolean;
  flags?: RelationalCatalogFlags;
  injected?: RelationalCatalogInjected;
  onQuickOrder?: (supplierId: string, productId: string) => void;
  onDiscuss?: (supplierId: string, productId: string) => void;
  onMail?: (supplierId: string) => void;
  contextRouting?: import("commercial-context-routing").CommercialContextRoutingInput;
};

export type RelationalOrderLine = {
  productId: string;
  productName: string;
  priceLabel: string;
  quantity: number;
};
