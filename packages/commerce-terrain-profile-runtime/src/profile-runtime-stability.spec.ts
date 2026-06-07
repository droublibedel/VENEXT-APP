/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";

import {
  getRemountKey,
  hydrateTerrainProfileFromServer,
  switchTerrainProfileAsync,
} from "./profile-runtime-engine.js";
import {
  getProfileRuntimeStability,
  resetProfileRuntimeStability,
  shouldApplyRuntimeRemount,
  shouldDispatchNavigationReset,
  shouldSkipProfileSwitch,
} from "./profile-runtime-stability.js";
import { saveTerrainProfileCache } from "./storage.js";
import type { TerrainProfileState } from "./types.js";

function seedState(partial: Partial<TerrainProfileState>): void {
  saveTerrainProfileCache({
    userKey: "22507000000",
    primaryProfile: "detaillant",
    currentActiveProfile: "detaillant",
    activeProfileVersion: 1,
    profileContextId: "22507000000",
    profileSessionId: "sess-1",
    permissions: { featureFlags: {} },
    ...partial,
  } as TerrainProfileState);
}

describe("profile-runtime-stability", () => {
  beforeEach(() => {
    resetProfileRuntimeStability();
    seedState({});
  });

  it("skips switch when target is already active", () => {
    expect(shouldSkipProfileSwitch("detaillant")).toBe(true);
    expect(shouldSkipProfileSwitch("grossiste_b")).toBe(false);
  });

  it("does not remount when server state is unchanged", () => {
    const before = getRemountKey();
    hydrateTerrainProfileFromServer({
      userKey: "22507000000",
      currentActiveProfile: "detaillant",
      activeProfileVersion: 1,
      primaryProfile: "detaillant",
    });
    expect(getRemountKey()).toBe(before);
  });

  it("dedupes navigation reset for same profile version", () => {
    expect(shouldDispatchNavigationReset("grossiste_b", 3)).toBe(true);
    expect(shouldDispatchNavigationReset("grossiste_b", 3)).toBe(false);
    expect(shouldDispatchNavigationReset("grossiste_b", 4)).toBe(true);
  });

  it("shouldApplyRuntimeRemount returns false when profile and version unchanged", () => {
    const prev = {
      userKey: "22507000000",
      currentActiveProfile: "detaillant" as const,
      activeProfileVersion: 2,
      primaryProfile: "detaillant" as const,
      profileContextId: "22507000000",
    } as TerrainProfileState;
    seedState(prev);
    expect(
      shouldApplyRuntimeRemount(
        {
          ...prev,
        },
        prev,
      ),
    ).toBe(false);
  });
});

describe("profile-runtime-engine idempotent resync", () => {
  beforeEach(() => {
    resetProfileRuntimeStability();
    seedState({ currentActiveProfile: "grossiste_b", activeProfileVersion: 2, primaryProfile: "detaillant" });
  });

  it("short-circuits switchTerrainProfileAsync when already on profile", async () => {
    const before = getRemountKey();
    const result = await switchTerrainProfileAsync("grossiste_b");
    expect(result.active).toBe("grossiste_b");
    expect(getRemountKey()).toBe(before);
    expect(getProfileRuntimeStability().isSwitchingProfile).toBe(false);
  });
});
