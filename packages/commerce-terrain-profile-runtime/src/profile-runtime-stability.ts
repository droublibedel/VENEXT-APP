import type { TerrainProfileId, TerrainProfileState } from "./types.js";
import { loadTerrainProfileState } from "./storage.js";

export type ProfileRuntimeStabilitySnapshot = {
  isSwitchingProfile: boolean;
  lastAppliedProfile: TerrainProfileId | null;
  lastAppliedProfileVersion: number;
  lastRemountForVersion: number;
  lastNavigationResetKey: string;
  switchRequestId: number;
};

const stability: ProfileRuntimeStabilitySnapshot = {
  isSwitchingProfile: false,
  lastAppliedProfile: null,
  lastAppliedProfileVersion: 0,
  lastRemountForVersion: -1,
  lastNavigationResetKey: "",
  switchRequestId: 0,
};

export function getProfileRuntimeStability(): Readonly<ProfileRuntimeStabilitySnapshot> {
  return stability;
}

export function beginProfileSwitchRequest(): number {
  stability.isSwitchingProfile = true;
  stability.switchRequestId += 1;
  return stability.switchRequestId;
}

export function endProfileSwitchRequest(): void {
  stability.isSwitchingProfile = false;
}

export function shouldSkipProfileSwitch(target: TerrainProfileId): boolean {
  if (stability.isSwitchingProfile) return true;
  const current = loadTerrainProfileState().currentActiveProfile;
  return current === target;
}

export function shouldApplyRuntimeRemount(
  next: TerrainProfileState,
  prev: TerrainProfileState = loadTerrainProfileState(),
): boolean {
  if (prev.currentActiveProfile !== next.currentActiveProfile) {
    return true;
  }
  if ((prev.activeProfileVersion ?? 0) !== (next.activeProfileVersion ?? 0)) {
    return true;
  }
  return false;
}

export function markRuntimeRemountApplied(state: TerrainProfileState): void {
  stability.lastAppliedProfile = state.currentActiveProfile;
  stability.lastAppliedProfileVersion = state.activeProfileVersion ?? 0;
  stability.lastRemountForVersion = stability.lastAppliedProfileVersion;
}

export function shouldDispatchNavigationReset(profile: TerrainProfileId, version: number): boolean {
  const key = `${profile}:${version}`;
  if (stability.lastNavigationResetKey === key) return false;
  stability.lastNavigationResetKey = key;
  return true;
}

export function resetProfileRuntimeStability(): void {
  stability.isSwitchingProfile = false;
  stability.lastAppliedProfile = null;
  stability.lastAppliedProfileVersion = 0;
  stability.lastRemountForVersion = -1;
  stability.lastNavigationResetKey = "";
  stability.switchRequestId = 0;
}
