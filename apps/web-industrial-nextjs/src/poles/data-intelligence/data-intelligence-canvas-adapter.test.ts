import { describe, expect, it } from "vitest";
import type { DataIntelligenceBundleResponse } from "@venext/shared-contracts";
import { buildDataIntelligenceCanvasGeo } from "./data-intelligence-canvas-adapter";

describe("data intelligence canvas adapter", () => {
  it("builds zones from fragile territories", () => {
    const bundle = {
      version: "1",
      territoryIntelligence: {
        version: "1",
        fragileTerritories: [{ territoryCode: "SN_DAKAR", fragilityScore: 0.6, drivers: ["a"] }],
        crossPoleStress: 0.4,
        narrative: "n",
        policy: "ACTIVE",
        generatedAt: "t",
        organizationId: "o",
      },
      ontology: {
        version: "1",
        dependencyChains: [{ id: "c1", trigger: "t", poles: ["a", "b"], narrative: "n", propagationScore: 0.5 }],
        economicPropagationScore: 0.3,
        generatedAt: "t",
        organizationId: "o",
        policy: "ACTIVE",
        graphDensity: 0.1,
        poleConnectivity: {},
        cascadingImpacts: [],
        orderFailureImpactNarrative: "x",
        entityCounts: {
          orders: 0,
          negotiations: 0,
          messages: 0,
          relationships: 0,
          wallets: 0,
          shipments: 0,
          economicSignals7d: 0,
        },
      },
    } as unknown as DataIntelligenceBundleResponse;
    const geo = buildDataIntelligenceCanvasGeo(bundle);
    expect(geo.source).toBe("data_intelligence_bundle");
    expect((geo.zones.features as unknown[]).length).toBeGreaterThan(0);
  });
});
