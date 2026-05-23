import { describe, expect, it } from "vitest";

import { buildSupplyLogisticsCanvasGeo, labeledDemoOperationalFallback } from "./supply-logistics-canvas-adapter";

const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

describe("SupplyLogisticsCanvasAdapter (Instruction 15A)", () => {
  it("uses bundle data and labels silent empty when no version", () => {
    const geo = buildSupplyLogisticsCanvasGeo(null);
    expect(geo.source).toBe("silent_empty_state");
    expect(geo.zones.features.length).toBe(0);
  });

  it("builds zones/routes from bundle slices", () => {
    const now = new Date().toISOString();
    const bundle = {
      version: "1" as const,
      generatedAt: now,
      organizationId: DEMO_ORG,
      territoryFlow: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE" as const,
        cells: [
          {
            territoryKey: "SN_DAKAR",
            label: "Dakar",
            flowPressure: 0.7,
            collapseRisk: 0.2,
            burstHint: "overload" as const,
            drivers: ["orders:5"],
          },
        ],
        overloadedTerritories: ["SN_DAKAR"],
        weakSupplyTerritories: [],
      },
      routes: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE" as const,
        overloadedRoutes: ["SN_DAKAR→CI_ABIDJAN"],
        congestionClusters: 1,
        rows: [
          {
            corridorKey: "SN_DAKAR→CI_ABIDJAN",
            label: "Corridor",
            loadFactor: 0.6,
            instability: 0.4,
            delayCorridor: true,
            bottleneck: false,
            activeShipments: 3,
            recurringFailureHint: 0.2,
          },
        ],
        telemetryNote: "x",
      },
      warehousePressure: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE" as const,
        overloadedHubs: [],
        rows: [
          {
            hubKey: "SN/DAKAR",
            hubCode: "HUB:31111111",
            territory: "SN/Dakar",
            label: "Hub",
            source: "ORDER_PROXY" as const,
            queuePressure: 0.5,
            confidence: 0.55,
            saturation: 0.5,
            dispatchBottleneck: 0.3,
            queueInstability: 0.3,
            inventoryPressure: 0.2,
            openDispatchCount: 2,
          },
        ],
      },
      delayRadar: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE" as const,
        recurringDelayScore: 0.2,
        congestionEscalation: 0.1,
        routeInstability: 0.2,
        territoryCollapseRisk: 0.1,
        abnormalLatencyIndex: 0.2,
        hotspots: [{ key: "A→B", label: "hot", intensity: 0.5 }],
      },
      riskMatrix: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE" as const,
        rows: [{ id: "r1", severity: "elevated" as const, affectedTerritories: [], probableCause: "x", recommendation: "y", confidence: 0.6, relatedSignals: [] }],
      },
    };
    const geo = buildSupplyLogisticsCanvasGeo(bundle as never);
    expect(geo.source).toBe("supply_logistics_bundle");
    expect(geo.zones.features.length).toBeGreaterThan(0);
    expect(geo.routes.features.length).toBeGreaterThan(0);
  });

  it("labels demo-operational fallback mode explicitly", () => {
    const fb = labeledDemoOperationalFallback("unit test");
    expect(fb.source).toBe("supply_logistics_api_fallback");
    expect(fb.detail).toContain("unit test");
  });
});
