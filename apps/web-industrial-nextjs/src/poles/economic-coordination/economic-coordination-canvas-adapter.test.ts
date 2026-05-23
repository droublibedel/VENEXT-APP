import { describe, expect, it } from "vitest";

import {
  ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION,
  buildEconomicCoordinationCanvasGeo,
} from "./economic-coordination-canvas-adapter";

describe("economic-coordination canvas adapter", () => {
  it("exposes explicit French symbolic projection label", () => {
    expect(ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION.projectionLabelFr).toContain("Projection systémique symbolique");
    expect(ECONOMIC_COORDINATION_SYMBOLIC_PROJECTION.projectionLabelFr).toContain("non géographique réelle");
  });

  it("builds geo from bundle priorities", () => {
    const geo = buildEconomicCoordinationCanvasGeo({
      version: "1",
      policy: "ACTIVE",
      priorities: [{ priorityId: "p1", priorityScore: 0.5, priorityReason: "r", sourceSignals: [], affectedPoles: [], urgency: "MEDIUM", timeHorizon: "SHORT" }],
      posture: { posture: "STABLE", confidence: 0.5, systemicRisk: 0.1, coordinationStress: 0.1, explanation: "", sourceSignals: [], affectedPoles: [], affectedTerritories: [] },
      conflicts: [],
      orchestrations: [],
    } as never);
    expect(geo.source).toBe("economic_coordination_bundle");
    expect(geo.zones.features.length).toBeGreaterThan(0);
  });
});
