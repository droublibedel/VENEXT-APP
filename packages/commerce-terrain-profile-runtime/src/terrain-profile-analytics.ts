import { loadTerrainProfileState } from "./storage.js";
import type { TerrainProfileId } from "./types.js";

export type TerrainProfileAnalyticsDetail = {
  event: string;
  activeProfileType?: TerrainProfileId | null;
  primaryProfile?: TerrainProfileId | null;
  switchedProfile?: TerrainProfileId | null;
  switchFrequency?: number;
  crossProfileUsage?: boolean;
  enabledProfiles?: TerrainProfileId[];
  [key: string]: unknown;
};

export function buildTerrainProfileAnalyticsDetail(
  event: string,
  detail: Record<string, unknown> = {},
): TerrainProfileAnalyticsDetail {
  const state = loadTerrainProfileState();
  const crossProfileUsage = state.enabledProfiles.length > 1 && state.switchCount > 0;
  return {
    event,
    activeProfileType: state.currentActiveProfile,
    primaryProfile: state.primaryProfile,
    switchedProfile: detail.profile as TerrainProfileId | undefined ?? detail.next as TerrainProfileId | undefined,
    switchFrequency: state.switchCount,
    crossProfileUsage,
    enabledProfiles: state.enabledProfiles,
    profileSessionId: state.profileSessionId,
    ...detail,
  };
}

export function dispatchTerrainProfileAnalytics(
  event: string,
  detail: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("venext:terrain-profile-analytics", {
      detail: buildTerrainProfileAnalyticsDetail(event, detail),
    }),
  );
}
