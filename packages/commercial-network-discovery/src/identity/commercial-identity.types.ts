import type { CommercialContactMatchKind } from "../commercial-network-discovery.types";

export type CommercialActorType = "PRODUCER" | "GROSSISTE_A" | "GROSSISTE_B" | "DETAILLANT";

export type TerrainIdentityMode =
  | "CONTACT_FIRST"
  | "PSEUDO_FIRST"
  | "BUSINESS_SECONDARY"
  | "FORMAL_ONLY";

export type DisplayIdentityMode =
  | "FORMAL_IDENTITY"
  | "CONTACT_FIRST_IDENTITY"
  | "PSEUDO_FIRST_IDENTITY"
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

export type TerrainDisplayIdentity = {
  actorId: string;
  actorType: "GROSSISTE_B" | "DETAILLANT";
  phoneNumber: string;
  contactName?: string;
  /** Pseudo ou nom/prénom saisi à l'inscription terrain (20.72). */
  registeredDisplayName?: string;
  registeredBusinessName?: string;
  registeredPersonalName?: string;
  terrainIdentityMode?: TerrainIdentityMode;
  activityLabel?: string;
  city?: string;
  profileImageUrl?: string;
  displayName: string;
  secondaryName?: string;
  displayMode: DisplayIdentityMode;
  recognitionReason: RecognitionReason;
  isLocalContactNamePrivate: true;
};

export type FormalDisplayIdentity = {
  actorId: string;
  actorType: "PRODUCER" | "GROSSISTE_A";
  registeredBusinessName: string;
  logoUrl?: string;
  legalStatus?: string;
  activityLabel?: string;
  city?: string;
  displayName: string;
  secondaryName?: string;
  displayMode: "FORMAL_IDENTITY";
  recognitionReason: "FORMAL_VALIDATED_PARTNER";
};

export type ResolveTerrainDisplayIdentityInput = {
  actorId: string;
  actorType: "GROSSISTE_B" | "DETAILLANT";
  phoneNumber: string;
  contactName?: string;
  /** Pseudo ou nom/prénom saisi à l'inscription terrain (20.72). */
  registeredDisplayName?: string;
  registeredBusinessName?: string;
  registeredPersonalName?: string;
  activityLabel?: string;
  city?: string;
  profileImageUrl?: string;
  matchKind?: CommercialContactMatchKind;
  activityDiscovery?: boolean;
};

export type ResolveFormalDisplayIdentityInput = {
  actorId: string;
  actorType: "PRODUCER" | "GROSSISTE_A";
  registeredBusinessName?: string;
  legalName?: string;
  brandName?: string;
  registeredPersonalName?: string;
  activityLabel?: string;
  city?: string;
  logoUrl?: string;
  legalStatus?: string;
  representativeName?: string;
  validationLabel?: string;
};

export type CommercialIdentityFlags = {
  commercial_contact_first_identity_enabled?: boolean;
  commercial_activity_based_suggestions_enabled?: boolean;
  terrain_quick_onboarding_enabled?: boolean;
  terrain_pseudo_identity_enabled?: boolean;
};
