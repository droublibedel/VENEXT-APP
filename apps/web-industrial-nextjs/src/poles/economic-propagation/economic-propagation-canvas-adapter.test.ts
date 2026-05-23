import { describe, expect, it } from "vitest";

import { buildEconomicPropagationCanvasGeo, economicPropagationLabeledFallback } from "./economic-propagation-canvas-adapter";

describe("economic-propagation canvas adapter", () => {
  it("labels demo fallback source", () => {
    const fb = economicPropagationLabeledFallback("unit");
    expect(fb.source).toBe("economic_propagation_demo_fallback");
    expect(fb.geometryMode).toBe("SYMBOLIC_PROJECTION");
    expect(fb.zones.type).toBe("FeatureCollection");
  });

  it("builds geo from bundle", () => {
    const bundle = {
      version: "1" as const,
      generatedAt: new Date().toISOString(),
      organizationId: "o",
      overview: {
        version: "1" as const,
        generatedAt: new Date().toISOString(),
        organizationId: "o",
        policy: "ACTIVE" as const,
        headline: "h",
        systemicRiskRollup: 0.5,
        shockCount: 1,
        chainCount: 1,
        territoryFragileTop: 1,
      },
      shocks: [
        {
          id: "s1",
          type: "shipment_delayed",
          sourcePole: "supply_logistics",
          sourceEntityType: "x",
          severity: "MODERATE" as const,
          confidence: 0.6,
          affectedPoles: ["supply_logistics"],
          affectedTerritories: [],
          systemicRisk: 0.5,
          sourceSignals: ["a"],
          explanation: "e",
          createdAt: new Date().toISOString(),
        },
      ],
      chains: [
        {
          chainId: "c1",
          shock: {
            id: "s1",
            type: "shipment_delayed",
            sourcePole: "supply_logistics",
            sourceEntityType: "x",
            severity: "MODERATE" as const,
            confidence: 0.6,
            affectedPoles: ["supply_logistics"],
            affectedTerritories: [],
            systemicRisk: 0.5,
            sourceSignals: ["a"],
            explanation: "e",
            createdAt: new Date().toISOString(),
          },
          impacts: [],
          systemicRiskScore: 0.4,
          propagationDepth: 2,
          recommendedInterventions: ["i"],
        },
      ],
      territoryFragility: [
        {
          territory: "SN_DAKAR",
          globalSystemicPressure: 0.3,
          localTerritoryEvidence: 0.5,
          localEvidenceSignals: ["finance:unpaid_local:2"],
          fragilityScore: 0.55,
          liquidityExposure: 0.2,
          logisticsExposure: 0.3,
          relationshipExposure: 0.2,
          paymentExposure: 0.3,
          activationExposure: 0.1,
          resilienceScore: 0.4,
          explanation: "x",
        },
      ],
      simulationPreview: {
        simulationId: "sim",
        triggerType: "shipment_delayed",
        estimatedImpacts: [],
        predictedEscalation: "p",
        systemicRiskScore: 0.3,
        affectedPoles: [],
        affectedTerritories: [],
        mitigationRecommendations: [],
      },
    };
    const geo = buildEconomicPropagationCanvasGeo(bundle as never);
    expect(geo.source).toBe("economic_propagation_bundle");
    expect(geo.geometryMode).toBe("SYMBOLIC_PROJECTION");
    expect(geo.realGeography).toBe(false);
    expect(geo.projectionNote.length).toBeGreaterThan(20);
    expect(geo.projectionLabelFr).toContain("symbolique");
    expect(geo.zones.features.length).toBeGreaterThan(0);
  });
});
