import type {
  VenextActorProfile,
  VenextAuthPreferences,
  VenextAuthSession,
  VenextLocaleTag,
} from "./venext-auth.types";
import {
  readPersistedLocale,
  readPersistedPreferences,
  readPersistedProfile,
  readPersistedSession,
  writePersistedLocale,
  writePersistedPreferences,
  writePersistedProfile,
  writePersistedSession,
} from "./venext-auth-storage";
import type { VenextActorRole, VenextAuthFlags } from "./venext-auth.types";
import { refreshSessionLocally } from "./venext-auth-session";
import { isTerrainUnlimitedSession } from "./venext-wallet-adaptive-session";

export type PersistedAuthBundle = {
  session: VenextAuthSession | null;
  profile: VenextActorProfile | null;
  preferences: VenextAuthPreferences;
  locale: VenextLocaleTag | null;
};

export function loadPersistedAuthBundle(ctx?: {
  role?: VenextActorRole;
  flags?: VenextAuthFlags;
  balanceFcfa?: number;
}): PersistedAuthBundle {
  const unlimited =
    ctx?.role != null
      ? isTerrainUnlimitedSession({
          actorRole: ctx.role,
          balanceFcfa: ctx.balanceFcfa ?? 0,
          flags: ctx.flags,
        })
      : false;
  const session = refreshSessionLocally(readPersistedSession(), {
    unlimitedTerrainSession: unlimited,
  });
  return {
    session,
    profile: readPersistedProfile(),
    preferences: readPersistedPreferences(),
    locale: readPersistedLocale(),
  };
}

export function persistAuthBundle(bundle: {
  session?: VenextAuthSession | null;
  profile?: VenextActorProfile | null;
  preferences?: VenextAuthPreferences;
  locale?: VenextLocaleTag | null;
}): void {
  if (bundle.session !== undefined) writePersistedSession(bundle.session);
  if (bundle.profile !== undefined) writePersistedProfile(bundle.profile);
  if (bundle.preferences !== undefined) writePersistedPreferences(bundle.preferences);
  if (bundle.locale !== undefined) writePersistedLocale(bundle.locale);
}

export function persistOnboardingComplete(preferences: VenextAuthPreferences = {}): VenextAuthPreferences {
  const next = { ...preferences, onboardingDone: true };
  writePersistedPreferences(next);
  return next;
}

export function persistLastCommercialContext(
  context: Record<string, string>,
  preferences: VenextAuthPreferences = readPersistedPreferences(),
): VenextAuthPreferences {
  const next = { ...preferences, lastCommercialContext: context };
  writePersistedPreferences(next);
  return next;
}

export function persistLastWorkspace(
  workspace: string,
  preferences: VenextAuthPreferences = readPersistedPreferences(),
): VenextAuthPreferences {
  const next = { ...preferences, lastWorkspace: workspace };
  writePersistedPreferences(next);
  return next;
}
