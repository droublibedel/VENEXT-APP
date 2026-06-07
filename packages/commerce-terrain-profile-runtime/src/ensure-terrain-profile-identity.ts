import { hydrateTerrainProfileFromServer } from "./profile-runtime-engine.js";
import { setCurrentProfileOnBackend } from "./terrain-profile-api.js";
import { loadTerrainProfileState } from "./storage.js";
import type { TerrainProfileId } from "./types.js";

/** Pousse l'identité terrain côté BFF quand le client a un profil mais le serveur ne l'a pas encore. */
export async function ensureTerrainProfileIdentity(
  userKey: string,
  profile: TerrainProfileId,
  source: "onboarding" | "settings" = "settings",
): Promise<void> {
  const remote = await setCurrentProfileOnBackend(userKey, profile, source);
  hydrateTerrainProfileFromServer({ ...remote, userKey });
}

export function resolveTerrainProfileBootstrap(
  userKey: string,
  fallback: TerrainProfileId = "detaillant",
): TerrainProfileId {
  const local = loadTerrainProfileState();
  if (local.userKey === userKey && local.primaryProfile) return local.primaryProfile;
  if (local.userKey === userKey && local.currentActiveProfile) return local.currentActiveProfile;
  return fallback;
}
