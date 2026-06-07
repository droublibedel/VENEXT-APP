import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getRemountKey,
  getTerrainProfileState,
  isTerrainProfileSwitchInProgress,
  setPrimaryTerrainProfileAsync,
  subscribeTerrainProfileRuntime,
  switchTerrainProfileAsync,
} from "./profile-runtime-engine.js";
import { dispatchTerrainProfileAnalytics } from "./terrain-profile-analytics.js";
import { getProfileRuntimeContext } from "./terrain-profile-isolation-layer.js";
import { mergeTerrainProfileFeatureFlags } from "./feature-flags.js";
import type { TerrainProfileFeatureFlags } from "./feature-flags.js";
import type { TerrainProfileId, TerrainProfileState } from "./types.js";
import { isOnline } from "./types.js";

type ProfileRuntimeContextValue = {
  state: TerrainProfileState;
  remountKey: number;
  activeProfile: TerrainProfileId | null;
  runtimeContext: ReturnType<typeof getProfileRuntimeContext>;
  featureFlags: TerrainProfileFeatureFlags;
  isTransitioning: boolean;
  switchError: string | null;
  isCachedProfile: boolean;
  setPrimaryProfile: (profile: TerrainProfileId) => Promise<boolean>;
  switchProfile: (profile: TerrainProfileId) => Promise<boolean>;
};

const ProfileRuntimeContext = createContext<ProfileRuntimeContextValue | null>(null);

const TRANSITION_MS = 420;

export const ProfileRuntimeProvider = memo(function ProfileRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<TerrainProfileState>(() => getTerrainProfileState());
  const [remountKey, setRemountKey] = useState(() => getRemountKey());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeTerrainProfileRuntime((next, key) => {
      setState(next);
      setRemountKey(key);
    });
  }, []);

  const runAsyncWithTransition = useCallback(async (action: () => Promise<void>): Promise<boolean> => {
    setSwitchError(null);
    if (!isOnline()) {
      setSwitchError("Changement de profil indisponible hors ligne.");
      return false;
    }
    setIsTransitioning(true);
    try {
      await action();
      return true;
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : "profile_switch_failed");
      return false;
    } finally {
      window.setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
    }
  }, []);

  const setPrimaryProfile = useCallback(async (profile: TerrainProfileId): Promise<boolean> => {
    return runAsyncWithTransition(async () => {
      await setPrimaryTerrainProfileAsync(profile, "onboarding");
      dispatchTerrainProfileAnalytics("profile_selected_onboarding", { profile });
    });
  }, [runAsyncWithTransition]);

  const switchProfile = useCallback(
    async (profile: TerrainProfileId): Promise<boolean> => {
      if (state.currentActiveProfile === profile) return true;
      if (isTerrainProfileSwitchInProgress()) return false;
      return runAsyncWithTransition(async () => {
        await switchTerrainProfileAsync(profile, "settings");
        dispatchTerrainProfileAnalytics("profile_switch_confirmed", { profile });
      });
    },
    [runAsyncWithTransition, state.currentActiveProfile],
  );

  const runtimeContext = useMemo(() => getProfileRuntimeContext(state), [state]);
  const featureFlags = useMemo(
    () => mergeTerrainProfileFeatureFlags(state.permissions?.featureFlags ?? {}, state.currentActiveProfile),
    [state.currentActiveProfile, state.permissions?.featureFlags],
  );

  const value = useMemo(
    () => ({
      state,
      remountKey,
      activeProfile: state.currentActiveProfile,
      runtimeContext,
      featureFlags,
      isTransitioning,
      switchError,
      isCachedProfile: Boolean(state.cachedProfile),
      setPrimaryProfile,
      switchProfile,
    }),
    [featureFlags, isTransitioning, remountKey, runtimeContext, setPrimaryProfile, state, switchError, switchProfile],
  );

  return <ProfileRuntimeContext.Provider value={value}>{children}</ProfileRuntimeContext.Provider>;
});

export function useTerrainProfileRuntime(): ProfileRuntimeContextValue {
  const ctx = useContext(ProfileRuntimeContext);
  if (!ctx) {
    throw new Error("useTerrainProfileRuntime must be used within ProfileRuntimeProvider");
  }
  return ctx;
}

export function useTerrainProfileRuntimeOptional(): ProfileRuntimeContextValue | null {
  return useContext(ProfileRuntimeContext);
}
