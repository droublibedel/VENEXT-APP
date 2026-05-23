export type CommercialActorRole = "grossiste_b" | "detaillant" | "grossiste_a" | "producteur";

export type CommercialDataSource = "live" | "fallback" | "mixed";

export type CommercialContactMatchKind = "mutual" | "one_way" | "activity_boosted";

export type DisplayIdentityMode =
  | "FORMAL_IDENTITY"
  | "CONTACT_FIRST_IDENTITY"
  | "MIXED_DISCOVERY_IDENTITY"
  | "UNKNOWN_CONTACT_IDENTITY";

export type RecognitionReason =
  | "CONTACT_MUTUAL_MATCH"
  | "CONTACT_ONE_WAY_MATCH"
  | "ACTIVITY_MATCH"
  | "CITY_MATCH"
  | "PRODUCT_INTEREST_MATCH"
  | "FORMAL_VALIDATED_PARTNER"
  | "UNKNOWN_CONTACT";

export type CommercialContactSuggestion = {
  id: string;
  phone: string;
  displayName: string;
  secondaryName?: string;
  city: string;
  activityLabel: string;
  photoInitials: string;
  matchKind: CommercialContactMatchKind;
  partnerStatus: "suggested" | "connected" | "pending";
  catalogPreviewCount: number;
  recentActivity?: string;
  hasOrders?: boolean;
  hasPayments?: boolean;
  sameCorridor?: boolean;
  /** Viewer-local label from phone contacts — never shared with remote user. */
  localContactName?: string;
  /** Pseudo ou nom/prénom — prioritaire sur boutique (20.72). */
  registeredDisplayName?: string;
  registeredBusinessName?: string;
  registeredPersonalName?: string;
  displayMode?: DisplayIdentityMode;
  recognitionReason?: RecognitionReason;
  recognitionHint?: string;
  /** Grossiste | Producteur | Détaillant — affiché dans suggestions */
  partnerRoleLabel?: string;
  businessAudioId?: string;
  businessAudioUrl?: string;
  businessAudioDurationSeconds?: number;
  catalogPreviewImageUrls?: string[];
};

export type CommercialConnectedPartner = {
  id: string;
  displayName: string;
  secondaryName?: string;
  phone: string;
  city: string;
  activityType: string;
  connectedAt: string;
  availabilityLabel: string;
  localContactName?: string;
  registeredBusinessName?: string;
};

export type CommercialCatalogPreviewItem = {
  id: string;
  name: string;
  priceLabel: string;
  availability: "available" | "limited" | "unavailable";
  badge?: string;
};

export type CommercialCatalogPreviewData = {
  partnerId: string;
  partnerName: string;
  updatedAt: string;
  products: CommercialCatalogPreviewItem[];
  popularLabel?: string;
  promotionLabel?: string;
};

export type CommercialDiscoveryView = {
  suggestions: CommercialContactSuggestion[];
  connected: CommercialConnectedPartner[];
  contactSyncGranted: boolean;
  localContactsCount: number;
};

export type CommercialDiscoveryInjected = {
  view: CommercialDiscoveryView | null;
  catalogByPartnerId?: Record<string, CommercialCatalogPreviewData>;
  dataSource: CommercialDataSource;
  fallbackUsed: boolean;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onConnect?: (suggestionId: string) => void;
  onQuickOrder?: (partnerId: string, productId?: string) => void;
  onMessage?: (partnerId: string) => void;
  grantContactSync?: () => void;
};

export type CommercialDiscoveryShellProps = {
  actorRole: CommercialActorRole;
  enabled?: boolean;
  injected?: CommercialDiscoveryInjected;
  flags?: CommercialDiscoveryFlags;
  governance?: CommercialDiscoveryGovernance;
};

export type CommercialDiscoveryFlags = {
  commercial_network_discovery_enabled?: boolean;
  commercial_auto_accept_enabled?: boolean;
  commercial_contact_first_identity_enabled?: boolean;
  commercial_activity_based_suggestions_enabled?: boolean;
};

export type CommercialDiscoveryGovernance = {
  autoAcceptCommercialConnections: boolean;
  contactSyncEnabled: boolean;
  catalogVisibleAfterConnection: boolean;
  autoPartnerSuggestions: boolean;
  restrictedPartnerMode: boolean;
  terrainMode: boolean;
  notice?: string;
};
