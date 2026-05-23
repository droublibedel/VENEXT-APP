/**
 * Instruction 20.22 — unit tests for geo-economic engines (deterministic, bounded).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { RelationalGeoEconomicDensityService } from "./relational-geo-economic-density.service";
import { RelationalGeoEconomicExpansionService } from "./relational-geo-economic-expansion.service";
import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";
import { RelationalGeoEconomicPressureService } from "./relational-geo-economic-pressure.service";
import { RelationalGeoEconomicPropagationService } from "./relational-geo-economic-propagation.service";

describe("RelationalGeoEconomicPolicyService", () => {
  const policy = new RelationalGeoEconomicPolicyService();

  it("canMutateGeoEconomicState forbids TERMINATED corridors", () => {
    expect(policy.canMutateGeoEconomicState(CommercialCorridorState.TERMINATED)).toBe(false);
    expect(policy.canMutateGeoEconomicState(CommercialCorridorState.ACTIVE)).toBe(true);
  });

  it("VENEXT_GEO_PROPAGATION_MAX_DEPTH clamps propagation depth", () => {
    const prev = process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH;
    process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH = "3";
    expect(new RelationalGeoEconomicPolicyService().maxPropagationDepth()).toBe(3);
    process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH = "999";
    expect(new RelationalGeoEconomicPolicyService().maxPropagationDepth()).toBe(32);
    if (prev === undefined) delete process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH;
    else process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH = prev;
  });
});

describe("RelationalGeoEconomicDensityService", () => {
  it("computeZoneDensity keeps scores within 0..100", () => {
    const policy = new RelationalGeoEconomicPolicyService();
    const density = new RelationalGeoEconomicDensityService(policy);
    const v = density.computeZoneDensity({
      corridorCount: 400,
      clusterCount: 80,
      pressureScore: 999,
      dependencyDensity: 999,
      fragilityScore: 999,
      propagationExposureScore: 999,
    });
    expect(v.corridorDensity).toBeLessThanOrEqual(100);
    expect(v.operationalDensityScore).toBeLessThanOrEqual(100);
    expect(v.pressureDensity).toBeGreaterThanOrEqual(0);
  });
});

describe("RelationalGeoEconomicPressureService", () => {
  it("detectPressureZones returns bounded code lists", () => {
    const policy = new RelationalGeoEconomicPolicyService();
    const svc = new RelationalGeoEconomicPressureService(policy);
    const det = svc.detectPressureZones([
      {
        zoneCode: "GEO:CI:ABIDJAN",
        economicPressureScore: 90,
        corridorCount: 12,
        systemicExposureScore: 80,
        operationalDensityScore: 90,
      },
    ]);
    expect(det.pressureLevel).toBe("CRITICAL");
    expect(det.congestedZoneCodes.length).toBeLessThanOrEqual(40);
  });
});

describe("RelationalGeoEconomicExpansionService", () => {
  it("computeExpansionPotential stays bounded", () => {
    const policy = new RelationalGeoEconomicPolicyService();
    const svc = new RelationalGeoEconomicExpansionService(policy);
    const r = svc.computeExpansionPotential({
      corridorCount: 2,
      corridorWeightAvg: 0.1,
      operationalDensityScore: 20,
      economicPressureScore: 80,
      peerCorridorCount: 20,
    });
    expect(r.expansionPotentialScore).toBeGreaterThanOrEqual(0);
    expect(r.expansionPotentialScore).toBeLessThanOrEqual(100);
  });
});

describe("RelationalGeoEconomicPropagationService", () => {
  it("projectRegionalPropagation respects max depth", async () => {
    const prev = process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH;
    process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH = "2";
    const policy = new RelationalGeoEconomicPolicyService();
    const dependency = {
      detectDependencyRelationships: vi
        .fn()
        .mockImplementation(async (id: string) => (id === "a" ? ["b"] : id === "b" ? ["c"] : [])),
    } as any;
    const svc = new RelationalGeoEconomicPropagationService(policy, dependency);
    const { cascadePaths, maxDepthObserved } = await svc.projectRegionalPropagation("a");
    expect(maxDepthObserved).toBeLessThanOrEqual(2);
    expect(cascadePaths.length).toBeGreaterThan(0);
    if (prev === undefined) delete process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH;
    else process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH = prev;
  });

  it("computeZoneExposure is bounded", () => {
    const policy = new RelationalGeoEconomicPolicyService();
    const svc = new RelationalGeoEconomicPropagationService(policy, {} as any);
    expect(svc.computeZoneExposure({ corridorCount: 999, systemicExposureScore: 999, fragilityScore: 999 })).toBe(
      100,
    );
  });
});
