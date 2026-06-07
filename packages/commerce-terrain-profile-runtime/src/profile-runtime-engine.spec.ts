/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";

import {
  setPrimaryTerrainProfile,
  switchTerrainProfile,
} from "./profile-runtime-engine.js";
import { clearTerrainProfileState, TERRAIN_PROFILE_STORAGE_KEY } from "./storage.js";

describe("profile-runtime-engine deprecated sync", () => {
  beforeEach(() => {
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
  });

  it("blocks local-only setPrimaryTerrainProfile", () => {
    expect(() => setPrimaryTerrainProfile("detaillant")).toThrow("setPrimaryTerrainProfile_use_async_backend");
  });

  it("blocks local-only switchTerrainProfile", () => {
    expect(() => switchTerrainProfile("detaillant")).toThrow("switchTerrainProfile_use_async_backend");
  });
});
