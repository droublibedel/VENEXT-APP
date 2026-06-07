/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  bootTerrainProfileFromBackend,
  setPrimaryTerrainProfileAsync,
  switchTerrainProfileAsync,
} from "./profile-runtime-engine.js";
import { clearTerrainProfileState, loadTerrainProfileState, saveTerrainProfileCache, TERRAIN_PROFILE_STORAGE_KEY } from "./storage.js";
import { resetDeviceIdForTests } from "./device-id.js";

function mockFetchIdentity(identity: Record<string, unknown> | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes("/api/terrain/profile-identity?")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, identity }),
        });
      }
      if (url.includes("/current-profile")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              identity: {
                userKey: "22507000001",
                currentActiveProfile: "detaillant",
                primaryProfile: "detaillant",
                enabledProfiles: ["detaillant"],
                activeProfileVersion: 1,
                cachedProfile: false,
              },
            }),
        });
      }
      if (url.includes("/switch")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              identity: {
                userKey: "22507000001",
                currentActiveProfile: "grossiste_b",
                primaryProfile: "detaillant",
                enabledProfiles: ["detaillant", "grossiste_b"],
                activeProfileVersion: 2,
                cachedProfile: false,
              },
            }),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ ok: false }) });
    }),
  );
}

describe("terrain-profile-backend-boot", () => {
  beforeEach(() => {
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
    resetDeviceIdForTests();
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("boot loads profile from backend not localStorage alone", async () => {
    saveTerrainProfileCache({
      userKey: "22507000001",
      enabledProfiles: ["grossiste_b"],
      primaryProfile: "grossiste_b",
      currentActiveProfile: "grossiste_b",
      switchCount: 0,
      cachedProfile: true,
    });
    mockFetchIdentity({
      userKey: "22507000001",
      currentActiveProfile: "detaillant",
      primaryProfile: "detaillant",
      enabledProfiles: ["detaillant"],
      activeProfileVersion: 3,
    });
    const state = await bootTerrainProfileFromBackend("22507000001");
    expect(state.currentActiveProfile).toBe("detaillant");
    expect(state.cachedProfile).toBe(false);
    expect(state.activeProfileVersion).toBe(3);
  });

  it("localStorage alone does not decide profile when backend responds", async () => {
    saveTerrainProfileCache({
      userKey: "22507000001",
      enabledProfiles: ["grossiste_b"],
      primaryProfile: "grossiste_b",
      currentActiveProfile: "grossiste_b",
      switchCount: 5,
      cachedProfile: true,
    });
    mockFetchIdentity({
      userKey: "22507000001",
      currentActiveProfile: "detaillant",
      primaryProfile: "detaillant",
      enabledProfiles: ["detaillant"],
      activeProfileVersion: 10,
    });
    await bootTerrainProfileFromBackend("22507000001");
    expect(loadTerrainProfileState().currentActiveProfile).toBe("detaillant");
  });

  it("offline boot uses cached profile marked cachedProfile", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    saveTerrainProfileCache({
      userKey: "22507000001",
      enabledProfiles: ["grossiste_b"],
      primaryProfile: "grossiste_b",
      currentActiveProfile: "grossiste_b",
      switchCount: 1,
      cachedProfile: true,
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const state = await bootTerrainProfileFromBackend("22507000001");
    expect(state.cachedProfile).toBe(true);
    expect(state.currentActiveProfile).toBe("grossiste_b");
  });

  it("switch persists via backend endpoint", async () => {
    saveTerrainProfileCache({
      userKey: "22507000001",
      enabledProfiles: ["detaillant", "grossiste_b"],
      primaryProfile: "detaillant",
      currentActiveProfile: "detaillant",
      switchCount: 1,
      activeProfileVersion: 1,
    });
    mockFetchIdentity(null);
    const result = await switchTerrainProfileAsync("grossiste_b");
    expect(result.confirmedByBackend).toBe(true);
    expect(loadTerrainProfileState().currentActiveProfile).toBe("grossiste_b");
    expect(loadTerrainProfileState().cachedProfile).toBe(false);
  });

  it("setPrimary calls backend current-profile", async () => {
    mockFetchIdentity(null);
    await setPrimaryTerrainProfileAsync("detaillant", "onboarding");
    expect(loadTerrainProfileState().currentActiveProfile).toBe("detaillant");
    expect(loadTerrainProfileState().cachedProfile).toBe(false);
  });

  it("rejects offline switch", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    saveTerrainProfileCache({
      userKey: "22507000001",
      enabledProfiles: ["detaillant"],
      primaryProfile: "detaillant",
      currentActiveProfile: "detaillant",
      switchCount: 0,
    });
    await expect(switchTerrainProfileAsync("grossiste_b")).rejects.toThrow("profile_switch_offline_not_allowed");
  });

  describe.each([
    ["detaillant"],
    ["grossiste_b"],
    ["detaillant"],
    ["grossiste_b"],
    ["detaillant"],
    ["grossiste_b"],
  ])("backend boot profile %s", (profile) => {
    it("replaces cache with backend truth", async () => {
      mockFetchIdentity({
        userKey: "22507000001",
        currentActiveProfile: profile,
        primaryProfile: profile,
        enabledProfiles: [profile],
        activeProfileVersion: 1,
      });
      const state = await bootTerrainProfileFromBackend("22507000001");
      expect(state.currentActiveProfile).toBe(profile);
      expect(state.cachedProfile).toBe(false);
    });
  });
});
