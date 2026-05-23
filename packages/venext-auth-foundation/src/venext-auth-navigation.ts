import type {
  VenextActorRole,
  VenextAuthPreferences,
  VenextAuthSession,
} from "./venext-auth.types";
import { defaultWorkspaceForActor } from "./venext-auth-actor";
import { clearAllAuthPersistence, readPersistedPreferences } from "./venext-auth-storage";
import { persistLastWorkspace, persistLastCommercialContext } from "./venext-auth-persistence";

export type AuthRedirectTarget = {
  workspace: string;
  commercialContext: Record<string, string>;
};

export function restoreLastWorkspace(
  role: VenextActorRole,
  preferences: VenextAuthPreferences = readPersistedPreferences(),
): string {
  return preferences.lastWorkspace ?? defaultWorkspaceForActor(role);
}

export function restoreLastCommercialContext(
  preferences: VenextAuthPreferences = readPersistedPreferences(),
): Record<string, string> {
  return preferences.lastCommercialContext ?? {};
}

export function redirectAuthenticatedActor(
  role: VenextActorRole,
  preferences: VenextAuthPreferences = readPersistedPreferences(),
): AuthRedirectTarget {
  return {
    workspace: restoreLastWorkspace(role, preferences),
    commercialContext: restoreLastCommercialContext(preferences),
  };
}

export function clearCommercialSession(_session?: VenextAuthSession | null): void {
  clearAllAuthPersistence();
}

export function rememberNavigationSnapshot(
  role: VenextActorRole,
  workspace: string,
  commercialContext: Record<string, string> = {},
  preferences?: VenextAuthPreferences,
): VenextAuthPreferences {
  let prefs = preferences ?? readPersistedPreferences();
  prefs = persistLastWorkspace(workspace, prefs);
  prefs = persistLastCommercialContext(commercialContext, prefs);
  return prefs;
}
