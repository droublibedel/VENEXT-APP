import type { TerrainProfileBackendIdentity, TerrainProfileId, TerrainProfileState } from "./types.js";
import { fromApiProfileId, isOnline, toApiProfileId } from "./types.js";
import { mergeTerrainFetchInit } from "./terrain-profile-api-headers.js";
import { getDeviceId } from "./device-id.js";
import { dispatchTerrainProfileAnalytics } from "./terrain-profile-analytics.js";

type BackendResponse = {
  ok: boolean;
  identity?: TerrainProfileBackendIdentity;
  runtimeContext?: TerrainProfileBackendIdentity["permissions"];
  code?: string;
  message?: string;
  conflictResolved?: boolean;
};

function mapBackendIdentity(identity: TerrainProfileBackendIdentity, userKey: string): Partial<TerrainProfileState> {
  const current = identity.currentActiveProfile
    ? fromApiProfileId(String(identity.currentActiveProfile))
    : null;
  const primary = identity.primaryProfile ? fromApiProfileId(String(identity.primaryProfile)) : null;
  const lastActive = identity.lastActiveProfile
    ? fromApiProfileId(String(identity.lastActiveProfile))
    : null;
  return {
    userKey,
    enabledProfiles: (identity.enabledProfiles ?? [])
      .map((p) => fromApiProfileId(String(p)))
      .filter((p): p is TerrainProfileId => p !== null),
    primaryProfile: primary,
    currentActiveProfile: current,
    lastActiveProfile: lastActive,
    activatedAt: identity.activatedAt,
    switchedAt: identity.switchedAt,
    switchReason: identity.switchReason,
    source: identity.source,
    switchCount: identity.switchCount ?? 0,
    profileSessionId: identity.profileSessionId,
    activeProfileVersion: identity.activeProfileVersion,
    lastSyncedAt: identity.lastSyncedAt ?? new Date().toISOString(),
    deviceId: identity.deviceId,
    permissions: identity.permissions,
    cachedProfile: false,
    pendingSwitchProfile: null,
  };
}

export async function fetchTerrainProfileIdentity(
  userKey: string,
): Promise<Partial<TerrainProfileState> | null> {
  try {
    const res = await fetch(
      `/api/terrain/profile-identity?userKey=${encodeURIComponent(userKey)}`,
      mergeTerrainFetchInit({ cache: "no-store" }),
    );
    if (!res.ok) return null;
    const body = (await res.json()) as BackendResponse;
    if (!body.ok || !body.identity?.currentActiveProfile) return null;
    dispatchTerrainProfileAnalytics("profile_loaded_from_backend", { userKey });
    return mapBackendIdentity(body.identity, userKey);
  } catch {
    return null;
  }
}

export async function setCurrentProfileOnBackend(
  userKey: string,
  profile: TerrainProfileId,
  source: "onboarding" | "settings" = "onboarding",
): Promise<Partial<TerrainProfileState>> {
  const res = await fetch(
    "/api/terrain/profile-identity/current-profile",
    mergeTerrainFetchInit({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey,
        currentActiveProfile: toApiProfileId(profile),
        primaryProfile: toApiProfileId(profile),
        deviceId: getDeviceId(),
        source,
      }),
    }),
  );
  const body = (await res.json()) as BackendResponse;
  if (!res.ok || !body.ok || !body.identity) {
    throw new Error(body.code ?? `terrain_current_profile_failed_${res.status}`);
  }
  dispatchTerrainProfileAnalytics("profile_switch_confirmed", { userKey, profile, source });
  return mapBackendIdentity(body.identity, userKey);
}

export async function switchProfileOnBackend(
  userKey: string,
  profile: TerrainProfileId,
  clientVersion?: number,
): Promise<Partial<TerrainProfileState>> {
  dispatchTerrainProfileAnalytics("profile_switch_requested", { userKey, profile });
  let res: Response;
  try {
    res = await fetch(
      "/api/terrain/profile-identity/switch",
      mergeTerrainFetchInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userKey,
          targetProfile: toApiProfileId(profile),
          deviceId: getDeviceId(),
          clientVersion,
          switchReason: "user_settings",
        }),
      }),
    );
  } catch {
    throw new Error("bff_unavailable");
  }
  const body = (await res.json()) as BackendResponse;
  if (!res.ok || !body.ok || !body.identity) {
    dispatchTerrainProfileAnalytics("profile_switch_rejected", {
      userKey,
      profile,
      code: body.code,
    });
    throw new Error(body.code ?? `terrain_switch_failed_${res.status}`);
  }
  if (body.conflictResolved) {
    dispatchTerrainProfileAnalytics("profile_conflict_resolved", {
      userKey,
      version: body.identity.activeProfileVersion,
    });
  }
  dispatchTerrainProfileAnalytics("profile_switch_confirmed", { userKey, profile });
  return mapBackendIdentity(body.identity, userKey);
}

export async function notifyOfflineCacheUsed(userKey: string): Promise<void> {
  dispatchTerrainProfileAnalytics("profile_cache_used_offline", { userKey });
  try {
    await fetch(
      "/api/terrain/profile-identity/offline-cache",
      mergeTerrainFetchInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userKey }),
      }),
    );
  } catch {
    // offline audit is best-effort
  }
}

export function terrainProfileFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, mergeTerrainFetchInit(init));
}

export function canSwitchProfileOffline(): boolean {
  return false;
}

export function canUseCachedProfileBoot(): boolean {
  return !isOnline();
}

/** @deprecated Backend is source of truth — use setCurrentProfileOnBackend / switchProfileOnBackend */
export async function syncTerrainProfileIdentity(_state: TerrainProfileState): Promise<void> {
  throw new Error("syncTerrainProfileIdentity_disabled_use_backend_endpoints");
}
