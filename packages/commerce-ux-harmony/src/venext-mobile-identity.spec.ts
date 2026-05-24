import { describe, expect, it } from "vitest";

import {
  auditVenextColorOveruse,
  VenextEconomicAccentRules,
  VenextNavigationIconSystem,
} from "./design-system/venext-mobile-identity";

describe("VENEXT mobile identity", () => {
  it("keeps green as a strategic accent", () => {
    expect(VenextEconomicAccentRules.maxAccentSurfaceRatio).toBe(0.1);
    expect(VenextNavigationIconSystem.library).toBe("lucide-react");
  });

  it("detects green surface overuse and excessive accent density", () => {
    const issues = auditVenextColorOveruse({
      greenSurfaceCount: 4,
      totalSurfaceCount: 12,
      accentElementCount: 8,
      visibleElementCount: 32,
      highGlowCount: 1,
    });

    expect(issues.map((i) => i.code)).toEqual([
      "green_surface_ratio_high",
      "accent_density_high",
      "glow_density_high",
    ]);
  });

  it("accepts calm premium dark surfaces", () => {
    expect(
      auditVenextColorOveruse({
        greenSurfaceCount: 1,
        totalSurfaceCount: 18,
        accentElementCount: 4,
        visibleElementCount: 34,
      }),
    ).toEqual([]);
  });
});
