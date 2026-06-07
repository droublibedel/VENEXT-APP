import {
  applyBackendTerrainProfileState,
  createEmptyTerrainProfileState,
  getCachedProfileForOfflineBoot,
  loadTerrainProfileState,
  saveTerrainProfileCache,
} from "./storage.js";
import type { TerrainProfileId, TerrainProfileState, TerrainProfileSwitchResult } from "./types.js";
import { isOnline } from "./types.js";
import {
  fetchTerrainProfileIdentity,
  notifyOfflineCacheUsed,
  setCurrentProfileOnBackend,
  switchProfileOnBackend,
} from "./terrain-profile-api.js";
import { dispatchTerrainProfileAnalytics } from "./terrain-profile-analytics.js";
import { ensureProfileSessionId } from "./profile-session.js";
import {
  ensureTerrainProfileResetManagerBootstrapped,
  TerrainProfileRuntimeResetManager,
} from "./terrain-profile-runtime-reset-manager.js";
import {
  beginProfileSwitchRequest,
  endProfileSwitchRequest,
  getProfileRuntimeStability,
  markRuntimeRemountApplied,
  shouldApplyRuntimeRemount,
  shouldSkipProfileSwitch,
} from "./profile-runtime-stability.js";

type Listener = (state: TerrainProfileState, remountKey: number) => void;

let remountKey = 0;
const listeners = new Set<Listener>();

function notify(
  state: TerrainProfileState,
  options: { force?: boolean; previous?: TerrainProfileState } = {},
): void {
  const prev = options.previous ?? loadTerrainProfileState();
  if (!options.force && !shouldApplyRuntimeRemount(state, prev)) {
    return;
  }
  remountKey += 1;
  markRuntimeRemountApplied(state);
  for (const listener of listeners) listener(state, remountKey);
}

function withProfileContext(state: TerrainProfileState): TerrainProfileState {
  return {
    ...state,
    profileContextId: state.profileContextId ?? state.userKey,
    profileSessionId: state.profileSessionId ?? ensureProfileSessionId(),
  };
}

function applyServerState(
  payload: Partial<TerrainProfileState>,
  userKey: string,
  options: { forceRemount?: boolean } = {},
): TerrainProfileState {
  const prev = loadTerrainProfileState();
  const next = withProfileContext(applyBackendTerrainProfileState(payload, userKey));
  notify(next, { force: options.forceRemount, previous: prev });
  return next;
}

export function getTerrainProfileState(): TerrainProfileState {
  return loadTerrainProfileState();
}

export function getActiveTerrainProfile(): TerrainProfileId | null {
  return loadTerrainProfileState().currentActiveProfile;
}

export function getRemountKey(): number {
  return remountKey;
}

export function subscribeTerrainProfileRuntime(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTerrainUserKey(userKey: string): void {
  const state = loadTerrainProfileState();
  if (state.userKey === userKey) return;
  saveTerrainProfileCache(withProfileContext({ ...state, userKey, profileContextId: userKey }));
}

export async function bootTerrainProfileFromBackend(userKey: string): Promise<TerrainProfileState> {
  const prev = loadTerrainProfileState();
  if (isOnline()) {
    const remote = await fetchTerrainProfileIdentity(userKey);
    if (remote?.currentActiveProfile) {
      const needsInitialMount = !prev.currentActiveProfile || prev.userKey !== userKey;
      return applyServerState(remote, userKey, { forceRemount: needsInitialMount });
    }
  }

  const cached = getCachedProfileForOfflineBoot();
  if (cached && cached.userKey === userKey) {
    void notifyOfflineCacheUsed(userKey);
    const offline = withProfileContext({ ...cached, cachedProfile: true });
    saveTerrainProfileCache(offline);
    notify(offline, { force: true });
    return offline;
  }

  const empty = withProfileContext(createEmptyTerrainProfileState(userKey));
  saveTerrainProfileCache(empty);
  notify(empty, { force: true });
  return empty;
}

export async function setPrimaryTerrainProfileAsync(
  profile: TerrainProfileId,
  source: "onboarding" | "settings" = "onboarding",
): Promise<TerrainProfileSwitchResult> {
  const prev = loadTerrainProfileState();
  if (shouldSkipProfileSwitch(profile) && prev.primaryProfile === profile) {
    return {
      previous: prev.currentActiveProfile,
      active: prev.currentActiveProfile ?? profile,
      remountKey,
      confirmedByBackend: true,
    };
  }
  if (!isOnline()) {
    throw new Error("profile_switch_offline_not_allowed");
  }

  const requestId = beginProfileSwitchRequest();
  try {
    const transition = await TerrainProfileRuntimeResetManager.beginProfileSwitch(
      prev.currentActiveProfile,
      profile,
      {
        userId: prev.userKey,
        profileContextId: prev.profileContextId,
        profileSessionVersion: (prev.activeProfileVersion ?? 0) + 1,
      },
    );

    const remote = await setCurrentProfileOnBackend(prev.userKey, profile, source);
    const next = applyServerState(remote, prev.userKey, { forceRemount: true });
    TerrainProfileRuntimeResetManager.completeProfileSwitch({
      ...transition,
      profileSessionVersion: next.activeProfileVersion ?? transition.profileSessionVersion,
    });
    return { previous: prev.currentActiveProfile, active: profile, remountKey, confirmedByBackend: true };
  } finally {
    if (getProfileRuntimeStability().switchRequestId === requestId) {
      endProfileSwitchRequest();
    }
  }
}

export async function switchTerrainProfileAsync(
  profile: TerrainProfileId,
  source: "settings" | "runtime" = "settings",
): Promise<TerrainProfileSwitchResult> {
  const prev = loadTerrainProfileState();
  if (!prev.primaryProfile) {
    return setPrimaryTerrainProfileAsync(profile, source === "settings" ? "settings" : "onboarding");
  }
  if (shouldSkipProfileSwitch(profile)) {
    return {
      previous: prev.currentActiveProfile,
      active: prev.currentActiveProfile ?? profile,
      remountKey,
      confirmedByBackend: true,
    };
  }
  if (!isOnline()) {
    throw new Error("profile_switch_offline_not_allowed");
  }

  const requestId = beginProfileSwitchRequest();
  try {
    const transition = await TerrainProfileRuntimeResetManager.beginProfileSwitch(
      prev.currentActiveProfile,
      profile,
      {
        userId: prev.userKey,
        profileContextId: prev.profileContextId,
        profileSessionVersion: (prev.activeProfileVersion ?? 0) + 1,
      },
    );

    const remote = await switchProfileOnBackend(prev.userKey, profile, prev.activeProfileVersion);
    const next = applyServerState(remote, prev.userKey, { forceRemount: true });
    TerrainProfileRuntimeResetManager.completeProfileSwitch({
      ...transition,
      profileSessionVersion: next.activeProfileVersion ?? transition.profileSessionVersion,
    });
    return {
      previous: prev.currentActiveProfile,
      active: next.currentActiveProfile ?? profile,
      remountKey,
      confirmedByBackend: true,
    };
  } finally {
    if (getProfileRuntimeStability().switchRequestId === requestId) {
      endProfileSwitchRequest();
    }
  }
}

/** Sync wrappers — deprecated, throw to prevent local-only switches */
export function setPrimaryTerrainProfile(
  _profile: TerrainProfileId,
  _source: "onboarding" | "settings" = "onboarding",
): TerrainProfileSwitchResult {
  throw new Error("setPrimaryTerrainProfile_use_async_backend");
}

export function switchTerrainProfile(
  _profile: TerrainProfileId,
  _source: "settings" | "runtime" = "settings",
): TerrainProfileSwitchResult {
  throw new Error("switchTerrainProfile_use_async_backend");
}

export function hydrateTerrainProfileFromServer(payload: Partial<TerrainProfileState>): void {
  const userKey = payload.userKey ?? loadTerrainProfileState().userKey;
  applyServerState(payload, userKey);
}

export function isTerrainProfileSwitchInProgress(): boolean {
  return getProfileRuntimeStability().isSwitchingProfile;
}

export function trackTerrainProfileAnalytics(
  event: string,
  detail: Record<string, unknown> = {},
): void {
  dispatchTerrainProfileAnalytics(event, detail);
}

export async function resyncTerrainProfileFromBackend(userKey: string): Promise<TerrainProfileState> {
  if (!isOnline()) {
    return loadTerrainProfileState();
  }
  const remote = await fetchTerrainProfileIdentity(userKey);
  if (!remote?.currentActiveProfile) {
    return loadTerrainProfileState();
  }
  return applyServerState(remote, userKey);
}

ensureTerrainProfileResetManagerBootstrapped();
