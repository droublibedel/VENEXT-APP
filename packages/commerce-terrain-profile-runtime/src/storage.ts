import type { TerrainProfileId, TerrainProfileState } from "./types.js";

export const TERRAIN_PROFILE_STORAGE_KEY = "venext_terrain_profile_runtime_v1";

export function createEmptyTerrainProfileState(userKey = "anonymous"): TerrainProfileState {
  return {
    userKey,
    enabledProfiles: [],
    primaryProfile: null,
    currentActiveProfile: null,
    switchCount: 0,
    cachedProfile: false,
  };
}

export function loadTerrainProfileState(): TerrainProfileState {
  try {
    const raw = localStorage.getItem(TERRAIN_PROFILE_STORAGE_KEY);
    if (!raw) return createEmptyTerrainProfileState();
    const parsed = JSON.parse(raw) as TerrainProfileState;
    return {
      ...createEmptyTerrainProfileState(parsed.userKey),
      ...parsed,
      enabledProfiles: Array.isArray(parsed.enabledProfiles) ? parsed.enabledProfiles : [],
    };
  } catch {
    return createEmptyTerrainProfileState();
  }
}

export function saveTerrainProfileState(state: TerrainProfileState): void {
  localStorage.setItem(TERRAIN_PROFILE_STORAGE_KEY, JSON.stringify(state));
}

export function saveTerrainProfileCache(state: TerrainProfileState): void {
  saveTerrainProfileState({ ...state, cachedProfile: true });
}

export function applyBackendTerrainProfileState(
  payload: Partial<TerrainProfileState>,
  userKey: string,
): TerrainProfileState {
  const state: TerrainProfileState = {
    ...createEmptyTerrainProfileState(userKey),
    ...loadTerrainProfileState(),
    ...payload,
    userKey,
    enabledProfiles: payload.enabledProfiles?.length
      ? payload.enabledProfiles
      : loadTerrainProfileState().enabledProfiles,
    cachedProfile: false,
    pendingSwitchProfile: null,
    lastSyncedAt: new Date().toISOString(),
  };
  saveTerrainProfileState(state);
  return state;
}

export function clearTerrainProfileState(): void {
  localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
}

export function ensureProfileEnabled(
  state: TerrainProfileState,
  profile: TerrainProfileId,
): TerrainProfileId[] {
  if (state.enabledProfiles.includes(profile)) return state.enabledProfiles;
  return [...state.enabledProfiles, profile];
}

export function getCachedProfileForOfflineBoot(): TerrainProfileState | null {
  const state = loadTerrainProfileState();
  if (!state.currentActiveProfile) return null;
  return { ...state, cachedProfile: true };
}
