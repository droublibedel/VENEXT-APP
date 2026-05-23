import { describe, expect, it } from "vitest";

import { buildEconomicCommandBundleFromSlices, isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

describe("economic-command fallback bundle (18.5A)", () => {
  const org = "31111111-1111-1111-1111-111111111101";

  it("reconstructs degraded bundle with overview and narrative when slices supply them", () => {
    const ts = "2026-01-01T00:00:00.000Z";
    const { bundle, missingSlices } = buildEconomicCommandBundleFromSlices(org, {
      overview: {
        version: "1",
        generatedAt: ts,
        organizationId: org,
        policy: "ACTIVE",
        headline: "h",
        executivePosture: "STABLE",
        dominantStress: "logistics",
        tensionCount: 0,
        pressureZoneCount: 0,
        riskCount: 0,
        arbitrationCount: 0,
        signalDigest: "d",
      },
      pressureZones: null,
      decisionRisks: null,
      arbitrations: null,
      silentTensions: null,
      narrative: {
        narrativeMode: "HEURISTIC_EXECUTIVE_SUMMARY",
        lines: ["a", "b"],
        dominantPressure: "x",
        executiveWarning: "w",
        recommendedFocus: "f",
        limitations: "l",
      },
      systemStress: null,
    });
    expect(bundle.degraded).toBe(true);
    expect(bundle.sourceMode).toBe("SEQUENTIAL_SLICE_FALLBACK");
    expect(bundle.overview.headline).toBe("h");
    expect(bundle.narrative.lines[0]).toBe("a");
    expect(missingSlices).toContain("pressure-zones");
    expect(isEconomicCommandSliceMissing(bundle, "pressure-zones")).toBe(true);
    expect(isEconomicCommandSliceMissing(bundle, "overview")).toBe(false);
  });
});
