import { describe, expect, it } from "vitest";

import { buildEconomicMemoryCanvasGeo, economicMemoryLabeledFallback } from "./economic-memory-canvas-adapter";

describe("economic-memory canvas adapter", () => {
  it("labels symbolic historical projection on fallback", () => {
    const fb = economicMemoryLabeledFallback("unit");
    expect(fb.projectionLabelFr).toContain("historique");
    expect(fb.geometryMode).toBe("SYMBOLIC_PROJECTION");
  });

  it("builds geo from memory bundle", () => {
    const bundle = {
      version: "1" as const,
      generatedAt: new Date().toISOString(),
      organizationId: "o",
      policy: "ACTIVE" as const,
      headline: "h",
      disclaimer: "d",
      crisisSignatures: [
        {
          id: "c1",
          signatureCode: "liquidity_fragility_cluster",
          systemicRisk: 0.6,
          recurrenceProbability: 0.4,
          similarityIndex: 0.5,
          explanation: "x",
          affectedPoles: ["finance_collections"],
          recommendedPriority: "HIGH" as const,
          territory: "SN_DAKAR",
          createdAt: new Date().toISOString(),
        },
      ],
      temporalAnalysis: null,
      propagationHistoryPreview: [
        {
          id: "e1",
          eventType: "propagation_shock.shipment_delayed",
          pole: "supply_logistics",
          territory: "SN_DAKAR",
          severity: "MODERATE",
          confidence: 0.5,
          createdAt: new Date().toISOString(),
        },
      ],
      shockPatterns: [],
      territoryHistoryPreview: [],
    };
    const geo = buildEconomicMemoryCanvasGeo(bundle);
    expect(geo.source).toBe("economic_memory_bundle");
    expect(geo.zones.features.length).toBeGreaterThan(0);
  });
});
