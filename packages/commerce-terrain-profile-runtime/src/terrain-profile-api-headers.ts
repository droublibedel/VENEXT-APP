import type { TerrainProfileId, TerrainProfileState } from "./types.js";
import { toApiProfileId } from "./types.js";
import { getProfileSessionVersion } from "./terrain-profile-runtime-reset-manager.js";
import { ensureProfileSessionId } from "./profile-session.js";
import { loadTerrainProfileState } from "./storage.js";

export const TERRAIN_PROFILE_HEADERS = {
  ACTIVE_PROFILE: "X-Venext-Active-Profile",
  RUNTIME_CONTEXT: "X-Venext-Runtime-Context",
  PROFILE_SESSION: "X-Venext-Profile-Session-Id",
  PROFILE_SESSION_VERSION: "X-Venext-Profile-Session-Version",
  PROFILE_CONTEXT_ID: "X-Venext-Profile-Context-Id",
  USER_ID: "X-Venext-User-Id",
} as const;

export function buildTerrainApiHeaders(state?: TerrainProfileState): Record<string, string> {
  const resolved = state ?? loadTerrainProfileState();
  const headers: Record<string, string> = {
    [TERRAIN_PROFILE_HEADERS.RUNTIME_CONTEXT]: "terrain_mobile",
    [TERRAIN_PROFILE_HEADERS.PROFILE_SESSION]: resolved.profileSessionId ?? ensureProfileSessionId(),
    [TERRAIN_PROFILE_HEADERS.PROFILE_SESSION_VERSION]: String(
      resolved.activeProfileVersion ?? getProfileSessionVersion(),
    ),
    [TERRAIN_PROFILE_HEADERS.PROFILE_CONTEXT_ID]: resolved.profileContextId ?? resolved.userKey,
    [TERRAIN_PROFILE_HEADERS.USER_ID]: resolved.userKey,
  };
  if (resolved.currentActiveProfile) {
    headers[TERRAIN_PROFILE_HEADERS.ACTIVE_PROFILE] = toApiProfileId(resolved.currentActiveProfile);
  }
  return headers;
}

export function mergeTerrainFetchInit(init: RequestInit = {}, state?: TerrainProfileState): RequestInit {
  const terrainHeaders = buildTerrainApiHeaders(state);
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(terrainHeaders)) {
    headers.set(key, value);
  }
  return { ...init, headers, credentials: init.credentials ?? "include" };
}

export function assertApiProfileAccess(
  activeProfile: TerrainProfileId | null,
  requiredProfile: TerrainProfileId,
): { allowed: boolean; reason?: string } {
  if (!activeProfile) return { allowed: false, reason: "no_active_profile" };
  if (activeProfile !== requiredProfile) {
    return { allowed: false, reason: "profile_context_mismatch" };
  }
  return { allowed: true };
}
