import { describe, expect, it } from "vitest";

import {
  isTerrainProfileHostActive,
  resolveTerrainProfileHostState,
} from "./terrain-profile-host-access.js";

describe("terrain-profile-host-access", () => {
  it("treats active terrain profile as always ready even before flag hydration", () => {
    expect(
      resolveTerrainProfileHostState({
        expectedProfile: "detaillant",
        activeProfile: "detaillant",
        mobileEnabled: false,
        hydrated: false,
      }),
    ).toBe("ready");
  });

  it("shows loading while flags hydrate outside terrain shell context", () => {
    expect(
      resolveTerrainProfileHostState({
        expectedProfile: "detaillant",
        activeProfile: null,
        mobileEnabled: undefined,
        hydrated: false,
      }),
    ).toBe("loading");
  });

  it("shows unavailable only when flag explicitly disables standalone app", () => {
    expect(
      resolveTerrainProfileHostState({
        expectedProfile: "grossiste_b",
        activeProfile: null,
        mobileEnabled: false,
        hydrated: true,
      }),
    ).toBe("unavailable");
  });

  it("detects host active mapping", () => {
    expect(isTerrainProfileHostActive("grossiste_b", "grossiste_b")).toBe(true);
    expect(isTerrainProfileHostActive("detaillant", "grossiste_b")).toBe(false);
  });
});
