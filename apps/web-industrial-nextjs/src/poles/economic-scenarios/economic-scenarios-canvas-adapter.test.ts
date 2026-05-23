import { describe, expect, it } from "vitest";
import type { EconomicScenariosBundle } from "@venext/shared-contracts";

import { buildEconomicScenariosCanvasGeo, economicScenariosLabeledFallback } from "./economic-scenarios-canvas-adapter";

function minimalBundle(): EconomicScenariosBundle {
  const ts = new Date().toISOString();
  return {
    version: "1",
    generatedAt: ts,
    organizationId: "31111111-1111-1111-1111-111111111101",
    policy: "ACTIVE",
    headline: "h",
    disclaimer: "d",
    overview: {
      version: "1",
      generatedAt: ts,
      organizationId: "31111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      headline: "o",
      scenarioCount: 1,
      maxProjectedRisk: 0.5,
      meanStabilizationProbability: 0.5,
      dominantScenarioTypes: ["supply_disruption"],
    },
    scenarios: [
      {
        scenarioCode: "c1",
        scenarioType: "supply_disruption",
        triggerType: "shipment_delayed",
        severity: "HIGH",
        sourcePole: "supply_logistics",
        confidence: 0.6,
        affectedPoles: ["supply_logistics"],
        affectedTerritories: ["SN_DAKAR"],
        projectedRisk: 0.55,
        stabilizationProbability: 0.5,
        estimatedPropagationDepth: 2,
        trajectory: {
          provenance: ["unit"],
          steps: [
            {
              label: "T0",
              systemicRisk: 0.4,
              unstableTerritories: ["SN_DAKAR"],
              impactedPoles: ["supply_logistics"],
              stabilizationTrend: "FLAT",
              volatilityShift: "FLAT",
              propagationAcceleration: 0.5,
            },
            {
              label: "T1",
              systemicRisk: 0.45,
              unstableTerritories: ["SN_DAKAR"],
              impactedPoles: ["supply_logistics"],
              stabilizationTrend: "DEGRADING",
              volatilityShift: "UP",
              propagationAcceleration: 0.6,
            },
            {
              label: "T2",
              systemicRisk: 0.5,
              unstableTerritories: ["SN_DAKAR"],
              impactedPoles: ["supply_logistics"],
              stabilizationTrend: "DEGRADING",
              volatilityShift: "UP",
              propagationAcceleration: 0.65,
            },
            {
              label: "T3",
              systemicRisk: 0.55,
              unstableTerritories: ["SN_DAKAR"],
              impactedPoles: ["supply_logistics"],
              stabilizationTrend: "DEGRADING",
              volatilityShift: "UP",
              propagationAcceleration: 0.7,
            },
          ],
        },
        impacts: [],
      },
    ],
    comparisons: [],
  };
}

describe("economic-scenarios canvas adapter", () => {
  it("labels symbolic prospective projection in FR", () => {
    const geo = buildEconomicScenariosCanvasGeo(minimalBundle());
    expect(geo.projectionLabelFr).toContain("Projection prospective symbolique");
    expect(geo.source).toBe("economic_scenarios_bundle");
  });

  it("fallback keeps symbolic projection label", () => {
    const fb = economicScenariosLabeledFallback("unit test");
    expect(fb.projectionLabelFr).toContain("non géographique");
    expect(fb.source).toBe("economic_scenarios_demo_fallback");
  });
});
