import type {
  FormalActorProfile,
  TerrainActorProfile,
  VenextActorRole,
  VenextAuthFlags,
  VenextAuthState,
  VenextLocaleTag,
} from "./venext-auth.types";
import { MOCK_TERRAIN_OTP } from "./venext-auth.types";
import { createAuthSession } from "./venext-auth-session";
import {
  createEmptyFormalProfile,
  createEmptyTerrainProfile,
  isFormalProfileComplete,
  isTerrainProfileComplete,
  normalizeFormalProfile,
  normalizeTerrainProfile,
} from "./venext-auth-profile";
import { isFormalActor, isTerrainActor } from "./venext-auth-actor";
import {
  loadPersistedAuthBundle,
  persistAuthBundle,
  persistOnboardingComplete,
} from "./venext-auth-persistence";
import { refreshSessionLocally } from "./venext-auth-session";
import { validateSessionActor } from "./venext-auth-security.guard";
import { isAuthFoundationEnabled } from "./venext-auth-permissions";
import { isTerrainUnlimitedSession } from "./venext-wallet-adaptive-session";

export type AuthWalletSessionContext = {
  balanceFcfa?: number;
};

function resolveUnlimitedSession(
  role: VenextActorRole,
  flags: VenextAuthFlags,
  walletCtx: AuthWalletSessionContext = {},
): boolean {
  return isTerrainUnlimitedSession({
    actorRole: role,
    balanceFcfa: walletCtx.balanceFcfa ?? 0,
    flags,
  });
}

export function validateTerrainPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 8;
}

export function validateTerrainOtp(otp: string): boolean {
  return otp.trim() === MOCK_TERRAIN_OTP;
}

export function validateFormalIdentifier(emailOrPhone: string): boolean {
  const v = emailOrPhone.trim();
  if (v.includes("@")) return v.length >= 5;
  return validateTerrainPhone(v);
}

export function validateFormalPassword(password: string): boolean {
  return password.trim().length >= 6;
}

export function createInitialAuthState(
  role: VenextActorRole,
  flags: VenextAuthFlags = {},
  walletCtx: AuthWalletSessionContext = {},
): VenextAuthState {
  if (!isAuthFoundationEnabled(flags) || flags.venext_session_restore_enabled === false) {
    return { status: "anonymous", session: null, profile: null, preferences: {} };
  }
  const unlimited = resolveUnlimitedSession(role, flags, walletCtx);
  const bundle = loadPersistedAuthBundle({ role, flags, balanceFcfa: walletCtx.balanceFcfa });
  const sessionCheck = validateSessionActor(bundle.session, role, { unlimitedTerrainSession: unlimited });
  if (!sessionCheck.valid) {
    return {
      status: "anonymous",
      session: null,
      profile: null,
      preferences: bundle.preferences,
    };
  }
  return {
    status: "authenticated",
    session: bundle.session,
    profile: bundle.profile,
    preferences: bundle.preferences,
  };
}

export function completeTerrainAuth(
  role: VenextActorRole,
  profileInput: Partial<TerrainActorProfile> & { phone: string },
  locale?: VenextLocaleTag,
  flags: VenextAuthFlags = {},
  walletCtx: AuthWalletSessionContext = {},
): VenextAuthState {
  const profile = normalizeTerrainProfile({
    ...profileInput,
    otpVerified: true,
    onboardingComplete: isTerrainProfileComplete(
      normalizeTerrainProfile({ ...profileInput, otpVerified: true }),
    ),
  });
  const unlimited = resolveUnlimitedSession(role, flags, walletCtx);
  const session = createAuthSession(role, "terrain_otp", Date.now(), { unlimitedTerrainSession: unlimited });
  const preferences = persistOnboardingComplete({ locale });
  persistAuthBundle({ session, profile, preferences, locale: locale ?? null });
  return { status: "authenticated", session, profile, preferences };
}

export function completeFormalAuth(
  role: VenextActorRole,
  profileInput: Partial<FormalActorProfile> & { structureName: string },
  locale?: VenextLocaleTag,
): VenextAuthState {
  const profile = normalizeFormalProfile(profileInput);
  const session = createAuthSession(role, "formal_password");
  const preferences = persistOnboardingComplete({
    locale,
    onboardingDone: isFormalProfileComplete(profile),
  });
  persistAuthBundle({ session, profile, preferences, locale: locale ?? null });
  return { status: "authenticated", session, profile, preferences };
}

export function logoutAuthState(): VenextAuthState {
  persistAuthBundle({ session: null, profile: null });
  return { status: "anonymous", session: null, profile: null, preferences: {} };
}

export function refreshAuthState(
  state: VenextAuthState,
  flags: VenextAuthFlags = {},
  walletCtx: AuthWalletSessionContext = {},
): VenextAuthState {
  if (!state.session) return state;
  const unlimited = resolveUnlimitedSession(state.session.actorRole, flags, walletCtx);
  const refreshed = refreshSessionLocally(state.session, { unlimitedTerrainSession: unlimited });
  if (!refreshed) return logoutAuthState();
  persistAuthBundle({ session: refreshed });
  return { ...state, session: refreshed };
}

export function emptyProfileForRole(role: VenextActorRole) {
  return isTerrainActor(role) ? createEmptyTerrainProfile() : createEmptyFormalProfile();
}

export function isProfileCompleteForRole(
  role: VenextActorRole,
  profile: VenextAuthState["profile"],
): boolean {
  if (!profile) return false;
  if (isTerrainActor(role) && profile.kind === "terrain") return isTerrainProfileComplete(profile);
  if (isFormalActor(role) && profile.kind === "formal") return isFormalProfileComplete(profile);
  return false;
}
