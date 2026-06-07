import type { TerrainProfileId } from "./types.js";
import { loadTerrainProfileState } from "./storage.js";
import { resolveProfileNavigation } from "./navigation-isolation.js";
import {
  purgeInactiveProfileCaches,
  registerProfileCachePurgeHandler,
  runProfileIsolationSwitch,
} from "./terrain-profile-isolation-layer.js";
import {
  cancelTerrainQueriesForProfile,
  removeTerrainQueriesForProfile,
  resetTerrainQueryRuntime,
} from "./terrain-profile-query-runtime.js";
import {
  registerBuiltinTerrainProfileStores,
  resetStoresForProfileSwitch,
  resetTerrainProfileStoreRegistry,
} from "./terrain-profile-store-registry.js";
import { clearTerrainOfflineQueueForProfile } from "./terrain-profile-offline-queue.js";
import { purgeTerrainNotificationsForProfile } from "./terrain-profile-notifications.js";
import { clearMessagingDraftsForProfile } from "./terrain-profile-messaging-isolation.js";
import { dispatchTerrainProfileAnalytics } from "./terrain-profile-analytics.js";
import { shouldDispatchNavigationReset } from "./profile-runtime-stability.js";

export type ProfileSwitchTransition = {
  previousProfile: TerrainProfileId | null;
  nextProfile: TerrainProfileId;
  userId: string;
  profileContextId: string;
  profileSessionVersion: number;
};

export type TerrainProfileResetPhase = "begin" | "complete";

const NAVIGATION_RESET_EVENT = "venext:terrain-profile-navigation-reset";

let interactionsFrozen = false;
let profileSessionVersion = 0;
let switchInProgress = false;
const backgroundDisposers = new Set<() => void>();

function bumpProfileSessionVersion(version?: number): number {
  profileSessionVersion = version ?? profileSessionVersion + 1;
  return profileSessionVersion;
}

export function getProfileSessionVersion(): number {
  return profileSessionVersion;
}

export function isTerrainProfileSwitchFrozen(): boolean {
  return interactionsFrozen || switchInProgress;
}

export function rejectStaleProfileSession(requestVersion: number | undefined): boolean {
  if (requestVersion == null) return false;
  return requestVersion < profileSessionVersion;
}

export function registerTerrainBackgroundDisposer(dispose: () => void): () => void {
  backgroundDisposers.add(dispose);
  return () => backgroundDisposers.delete(dispose);
}

function disposeBackgroundListeners(): void {
  for (const dispose of backgroundDisposers) dispose();
}

function dispatchNavigationReset(profile: TerrainProfileId, version: number): void {
  if (typeof window === "undefined") return;
  if (!shouldDispatchNavigationReset(profile, version)) return;
  const defaultTab = resolveProfileNavigation(profile).defaultTab;
  window.dispatchEvent(
    new CustomEvent(NAVIGATION_RESET_EVENT, {
      detail: { profile, defaultTab },
    }),
  );
}

export const TerrainProfileRuntimeResetManager = {
  async beginProfileSwitch(
    previousProfile: TerrainProfileId | null,
    nextProfile: TerrainProfileId,
    opts: { userId?: string; profileContextId?: string; profileSessionVersion?: number } = {},
  ): Promise<ProfileSwitchTransition> {
    const state = loadTerrainProfileState();
    if (previousProfile === nextProfile) {
      return {
        previousProfile,
        nextProfile,
        userId: opts.userId ?? state.userKey,
        profileContextId: opts.profileContextId ?? state.profileContextId ?? state.userKey,
        profileSessionVersion: getProfileSessionVersion(),
      };
    }
    switchInProgress = true;
    interactionsFrozen = true;

    const transition: ProfileSwitchTransition = {
      previousProfile,
      nextProfile,
      userId: opts.userId ?? state.userKey,
      profileContextId: opts.profileContextId ?? state.profileContextId ?? state.userKey,
      profileSessionVersion: bumpProfileSessionVersion(opts.profileSessionVersion),
    };

    if (previousProfile && previousProfile !== nextProfile) {
      cancelTerrainQueriesForProfile(previousProfile);
      clearMessagingDraftsForProfile(previousProfile);
      clearTerrainOfflineQueueForProfile(transition.userId, previousProfile);
      purgeTerrainNotificationsForProfile(transition.profileContextId, previousProfile);
      resetStoresForProfileSwitch(previousProfile, nextProfile);
      runProfileIsolationSwitch(previousProfile, nextProfile);
      removeTerrainQueriesForProfile(previousProfile);
    }

    dispatchTerrainProfileAnalytics("terrain_profile_reset_begin", {
      ...transition,
      phase: "begin" satisfies TerrainProfileResetPhase,
    });

    return transition;
  },

  completeProfileSwitch(transition: ProfileSwitchTransition): void {
    if (transition.previousProfile !== transition.nextProfile) {
      purgeInactiveProfileCaches(transition.nextProfile);
    }
    dispatchNavigationReset(transition.nextProfile, transition.profileSessionVersion);
    dispatchTerrainProfileAnalytics("terrain_profile_reset_complete", {
      ...transition,
      phase: "complete" satisfies TerrainProfileResetPhase,
    });
    switchInProgress = false;
    interactionsFrozen = false;
  },

  cancelProfileSwitch(): void {
    switchInProgress = false;
    interactionsFrozen = false;
  },

  resetAll(): void {
    disposeBackgroundListeners();
    resetTerrainQueryRuntime();
    resetTerrainProfileStoreRegistry();
    interactionsFrozen = false;
    switchInProgress = false;
    profileSessionVersion = 0;
  },
} as const;

let builtinsRegistered = false;

export function ensureTerrainProfileResetManagerBootstrapped(): void {
  if (builtinsRegistered) return;
  registerBuiltinTerrainProfileStores();
  registerProfileCachePurgeHandler((profile) => {
    cancelTerrainQueriesForProfile(profile);
    removeTerrainQueriesForProfile(profile);
  });
  builtinsRegistered = true;
}

export function subscribeTerrainNavigationReset(
  listener: (detail: { profile: TerrainProfileId; defaultTab: string }) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    listener((event as CustomEvent).detail);
  };
  window.addEventListener(NAVIGATION_RESET_EVENT, handler);
  return () => window.removeEventListener(NAVIGATION_RESET_EVENT, handler);
}

export { NAVIGATION_RESET_EVENT };
