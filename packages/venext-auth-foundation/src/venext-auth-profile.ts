import type {
  FormalActorProfile,
  TerrainActorProfile,
  VenextActorProfile,
  VenextActorRole,
} from "./venext-auth.types";
import { isFormalActor, isTerrainActor } from "./venext-auth-actor";
import { maskPhoneNumber } from "./venext-auth-security.guard";

export function createEmptyTerrainProfile(): TerrainActorProfile {
  return {
    kind: "terrain",
    phone: "",
    phoneMasked: "",
    displayName: "",
    activities: [],
    city: "",
    otpVerified: false,
    onboardingComplete: false,
  };
}

export function createEmptyFormalProfile(structureName = ""): FormalActorProfile {
  return {
    kind: "formal",
    structureName,
    sectors: [],
    commercialZones: [],
    relationalDocumentsEnabled: true,
  };
}

export function isTerrainProfileComplete(profile: TerrainActorProfile): boolean {
  return Boolean(
    profile.otpVerified &&
      profile.displayName.trim().length >= 2 &&
      profile.city.trim().length >= 2 &&
      profile.phone.replace(/\D/g, "").length >= 8,
  );
}

export function isFormalProfileComplete(profile: FormalActorProfile): boolean {
  return Boolean(profile.structureName.trim().length >= 2 && (profile.email || profile.phone));
}

export function normalizeTerrainProfile(
  partial: Partial<TerrainActorProfile> & { phone: string },
): TerrainActorProfile {
  const phone = partial.phone.trim();
  return {
    kind: "terrain",
    phone,
    phoneMasked: maskPhoneNumber(phone),
    displayName: partial.displayName?.trim() ?? "",
    businessName: partial.businessName?.trim() || undefined,
    activities: partial.activities ?? [],
    city: partial.city?.trim() ?? "",
    otpVerified: partial.otpVerified ?? false,
    onboardingComplete: partial.onboardingComplete ?? false,
    organizationId: partial.organizationId?.trim() || undefined,
  };
}

export function normalizeFormalProfile(
  partial: Partial<FormalActorProfile> & { structureName: string },
): FormalActorProfile {
  const phone = partial.phone?.trim();
  return {
    kind: "formal",
    email: partial.email?.trim() || undefined,
    phone,
    phoneMasked: phone ? maskPhoneNumber(phone) : undefined,
    structureName: partial.structureName.trim(),
    enterpriseRole: partial.enterpriseRole?.trim() || undefined,
    commercialZones: partial.commercialZones ?? [],
    sectors: partial.sectors ?? [],
    logoUrl: partial.logoUrl,
    relationalDocumentsEnabled: partial.relationalDocumentsEnabled ?? true,
  };
}

export function profileDisplayLabel(profile: VenextActorProfile | null): string {
  if (!profile) return "";
  if (profile.kind === "terrain") return profile.displayName || profile.phoneMasked;
  return profile.structureName;
}

export function assertProfileMatchesActor(
  role: VenextActorRole,
  profile: VenextActorProfile | null,
): boolean {
  if (!profile) return false;
  if (isTerrainActor(role)) return profile.kind === "terrain";
  if (isFormalActor(role)) return profile.kind === "formal";
  return false;
}
