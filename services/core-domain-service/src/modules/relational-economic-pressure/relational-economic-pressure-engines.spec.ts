import { describe, expect, it } from "vitest";

import type { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicContagionService } from "./relational-economic-contagion.service";
import { RelationalEconomicDependencyService } from "./relational-economic-dependency.service";
import { RelationalEconomicFragilityService } from "./relational-economic-fragility.service";
import { RelationalEconomicPressurePolicyService } from "./relational-economic-pressure-policy.service";

describe("Instruction 20.21 — economic pressure engines", () => {
  const policy = new RelationalEconomicPressurePolicyService();
  const contagion = new RelationalEconomicContagionService(policy);
  const fragility = new RelationalEconomicFragilityService(policy);

  it("policy clamps scores and blocks TERMINATED mutations", () => {
    expect(policy.clampInt(500)).toBe(100);
    expect(policy.canMutateEconomicPressureGraph("TERMINATED")).toBe(false);
    expect(policy.canMutateEconomicPressureGraph("ACTIVE")).toBe(true);
  });

  it("dependency density is bounded", () => {
    const dep = new RelationalEconomicDependencyService({} as unknown as PrismaService, policy);
    expect(dep.computeDependencyDensity(10, 5)).toBeLessThanOrEqual(100);
  });

  it("contagion BFS respects max depth from env", () => {
    process.env.VENEXT_ECONOMIC_PRESSURE_MAX_DEPTH = "2";
    expect(policy.maxContagionDepth()).toBe(2);
    const adj = new Map<string, string[]>([
      ["a", ["b"]],
      ["b", ["c"]],
      ["c", ["d"]],
    ]);
    const paths = contagion.projectContagionSpread(adj, "a", policy.maxContagionDepth());
    expect(paths.every((p) => p.length <= 3)).toBe(true);
    delete process.env.VENEXT_ECONOMIC_PRESSURE_MAX_DEPTH;
  });

  it("fragility detects concentration zones", () => {
    const zones = fragility.detectFragilityZones([
      { relationshipId: "x", fragilityScore: 60, dependencyDensity: 55, systemicWeight: 40, peerCount: 5 },
    ]);
    expect(zones.length).toBeGreaterThan(0);
    expect(fragility.detectExcessiveDependencyConcentration([{ relationshipId: "y", fragilityScore: 0, dependencyDensity: 70, systemicWeight: 0, peerCount: 7 }])).toBe(true);
  });
});
