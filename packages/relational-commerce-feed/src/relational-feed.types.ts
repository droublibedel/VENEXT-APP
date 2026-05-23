export type FeedEntryType = "PARTNER" | "SPONSORED" | "DISCOVERY" | "BOOTSTRAP" | "EXTENDED";

export type FeedPipelineLayer =
  | "PARTNER_CONTENT"
  | "EXTENDED_RELATIONAL_CONTENT"
  | "SPONSORED_RELATIONAL_CONTENT"
  | "DISCOVERY_SUGGESTIONS";

export type RelationalFeedActorRole = "grossiste_b" | "detaillant" | "grossiste_a" | "producteur";

export type FeedEntry = {
  id: string;
  type: FeedEntryType;
  layer: FeedPipelineLayer;
  partnerId: string;
  displayName: string;
  localContactName?: string;
  partnerRoleLabel?: string;
  city?: string;
  activityCategory: string;
  imageUrl?: string;
  catalogPreviewUrls?: string[];
  businessAudioUrl?: string;
  businessAudioDurationSeconds?: number;
  sponsored?: boolean;
  proximityScore: number;
  publishedAt: string;
  inviteable: boolean;
};

export type RelationalFeedResolverInput = {
  actorId: string;
  role: RelationalFeedActorRole;
  city?: string;
  categories?: string[];
  partnerIds?: string[];
  /** false = partenaires liés mais aucune publication (CAS 2 B-04) */
  partnersPublished?: boolean;
  contacts?: Array<{ phone: string; localName?: string; mutual?: boolean }>;
  interactionHistory?: string[];
};

export type RelationalFeedPage = {
  entries: FeedEntry[];
  hasMore: boolean;
  feedEmptyPrevented: boolean;
  layersUsed: FeedPipelineLayer[];
};

export type PartnerSuggestionCandidate = {
  id: string;
  displayName: string;
  localContactName?: string;
  registeredBusinessName?: string;
  partnerRoleLabel: string;
  city: string;
  activityCategory: string;
  phone?: string;
  mutualContact: boolean;
  catalogPreviewUrls?: string[];
  businessAudioUrl?: string;
  proximityScore: number;
};
