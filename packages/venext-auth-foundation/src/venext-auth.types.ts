export type VenextLocaleTag = "fr-CI" | "en" | "ar" | "zh-CN";

export type VenextActorRole = "PRODUCER" | "GROSSISTE_A" | "GROSSISTE_B" | "DETAILLANT";

export type VenextAuthMode = "terrain_otp" | "formal_password";

export type VenextActorProfileKind = "terrain" | "formal";

export type TerrainActorProfile = {
  kind: "terrain";
  phone: string;
  phoneMasked: string;
  displayName: string;
  businessName?: string;
  activities: string[];
  city: string;
  otpVerified: boolean;
  onboardingComplete: boolean;
  organizationId?: string;
};

export type FormalActorProfile = {
  kind: "formal";
  email?: string;
  phone?: string;
  phoneMasked?: string;
  structureName: string;
  enterpriseRole?: string;
  commercialZones?: string[];
  sectors?: string[];
  logoUrl?: string;
  relationalDocumentsEnabled?: boolean;
};

export type VenextActorProfile = TerrainActorProfile | FormalActorProfile;

export type VenextAuthSession = {
  version: 1;
  sessionId: string;
  actorRole: VenextActorRole;
  authMode: VenextAuthMode;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
};

export type VenextAuthPreferences = {
  locale?: VenextLocaleTag;
  onboardingDone?: boolean;
  lastWorkspace?: string;
  lastCommercialContext?: Record<string, string>;
};

export type VenextAuthFlags = {
  venext_auth_foundation_enabled?: boolean;
  venext_session_restore_enabled?: boolean;
  venext_profile_foundation_enabled?: boolean;
  commercial_relationship_governance_enabled?: boolean;
  [key: string]: boolean | undefined;
};

export type VenextAuthState = {
  status: "anonymous" | "authenticated" | "restoring";
  session: VenextAuthSession | null;
  profile: VenextActorProfile | null;
  preferences: VenextAuthPreferences;
};

export type VenextPermissionKey =
  | "canAccessFormalMail"
  | "canAccessTerrainMessaging"
  | "canExposeRelationalCatalog"
  | "canUseAutoAccept"
  | "canAccessCommercialDelivery"
  | "canAccessSettlementFlows";

export type VenextGuardResult = {
  allowed: boolean;
  reason?: string;
  message?: string;
};

export const VENEXT_SESSION_STORAGE_KEY = "venext_session_v1";
export const VENEXT_PROFILE_STORAGE_KEY = "venext_actor_profile_v1";
export const VENEXT_LOCALE_STORAGE_KEY = "venext_locale_v1";
export const VENEXT_PREFERENCES_STORAGE_KEY = "venext_auth_preferences_v1";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const MOCK_TERRAIN_OTP = "123456";
