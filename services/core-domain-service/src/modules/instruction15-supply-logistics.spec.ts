import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsBundleResponse } from "@venext/shared-contracts";
import { SupplyLogisticsBundleResponseSchema } from "@venext/shared-contracts";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { DeliveryRouteIntelligenceService } from "./delivery-route-intelligence/delivery-route-intelligence.service";
import { SupplyInterventionsService } from "./supply-interventions/supply-interventions.service";
import { SupplyLogisticsController } from "./supply-logistics-intelligence/supply-logistics.controller";
import { TerritoryFlowService } from "./territory-flow/territory-flow.service";

const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

describe("Instruction 15 — supply_logistics_enabled gate", () => {
  it("throws Forbidden when flag is disabled", async () => {
    const flags = { isEnabled: vi.fn(async (k: string) => (k === "supply_logistics_enabled" ? false : true)) };
    const c = new SupplyLogisticsController(
      { organization: { findUnique: vi.fn() } } as never,
      flags as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await expect(c.overview(DEMO_ORG)).rejects.toBeInstanceOf(ForbiddenException);
    expect(flags.isEnabled).toHaveBeenCalledWith("supply_logistics_enabled", { organizationId: DEMO_ORG });
  });
});

describe("Instruction 15 — bundle schema", () => {
  it("parses minimal synthetic bundle", () => {
    const now = new Date().toISOString();
    const edge = {
      desktopEdgeSync: "PLANNED" as const,
      offlineRouteSync: "PLANNED" as const,
      intermittentConnectivityMode: "SUPPORTED_VIA_ADAPTIVE_UI" as const,
      localRouteCacheSchemaVersion: 1,
      routeTelemetry: { status: "NOT_CONFIGURED" as const, note: "x" },
    };
    const parsed = SupplyLogisticsBundleResponseSchema.safeParse({
      version: "1",
      generatedAt: now,
      organizationId: DEMO_ORG,
      overview: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        activeShipments: 2,
        delayedShipments: 0,
        unstableTerritories: 0,
        routeCongestionIndex: 0.3,
        warehousePressureIndex: 0.2,
        loadingDelayIndex: 0.1,
        fulfillmentConfidence: 0.7,
        downstreamSupplyQuality: 0.6,
        territoryInstability: 0.2,
        routeExecutionConfidence: 0.65,
        movementStrips: [],
        edgeReadiness: edge,
      },
      territoryFlow: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        cells: [],
        overloadedTerritories: [],
        weakSupplyTerritories: [],
      },
      shipmentHealth: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        healthyCount: 1,
        delayedCount: 0,
        unstableCount: 0,
        blockedCount: 0,
        suspiciousCount: 0,
        rows: [],
      },
      routes: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        overloadedRoutes: [],
        congestionClusters: 0,
        rows: [],
        telemetryNote: "n",
      },
      warehousePressure: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        overloadedHubs: [],
        rows: [],
      },
      loadingSupervision: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        loadingDelayCount: 0,
        unloadingInstabilityCount: 0,
        queueCongestionScore: 0,
        rows: [],
      },
      delayRadar: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        recurringDelayScore: 0,
        congestionEscalation: 0,
        routeInstability: 0,
        territoryCollapseRisk: 0,
        abnormalLatencyIndex: 0,
        hotspots: [],
      },
      fulfillmentStability: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        stabilityScore: 0.7,
        executionVariance: 0.2,
        downstreamCoherence: 0.65,
        bands: [],
      },
      riskMatrix: { generatedAt: now, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [] },
      briefing: { provider: "MockAIProvider", policy: "DISABLED", executiveSummary: "x" },
      interventions: { generatedAt: now, organizationId: DEMO_ORG, interventions: [] },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("Instruction 15 — territory flow pressure", () => {
  it("computes flow cells from orders", () => {
    const svc = new TerritoryFlowService();
    const snap = {
      organizationId: DEMO_ORG,
      generatedAt: new Date().toISOString(),
      orders: [
        {
          id: "71111111-1111-1111-1111-111111111099",
          buyerOrganizationId: "31111111-1111-1111-1111-111111111102",
          sellerOrganizationId: DEMO_ORG,
          relationshipId: "61111111-1111-1111-1111-111111111099",
          status: OrderStatus.ACCEPTED,
          paymentStatus: "UNPAID" as never,
          deliveryStatus: DeliveryStatus.PREPARING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      orgGeo: new Map([
        [DEMO_ORG, "SN/Dakar"],
        ["31111111-1111-1111-1111-111111111102", "SN/Thies"],
      ]),
      groupSessions: [],
      economicStates: [],
      economicSignals: [],
      deliveryThreadIds: [],
      deliveryMessageVolume: 0,
      shipments: [],
    };
    const out = svc.build(snap as never, true);
    expect(out.policy).toBe("ACTIVE");
    expect(out.cells.length).toBeGreaterThan(0);
  });
});

describe("Instruction 15 — route instability", () => {
  it("ranks corridors by instability", () => {
    const svc = new DeliveryRouteIntelligenceService();
    const snap = {
      organizationId: DEMO_ORG,
      generatedAt: new Date().toISOString(),
      orders: [
        {
          id: "a",
          buyerOrganizationId: "b1",
          sellerOrganizationId: "b2",
          status: OrderStatus.ACCEPTED,
          paymentStatus: "UNPAID" as never,
          deliveryStatus: DeliveryStatus.FAILED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "b",
          buyerOrganizationId: "b1",
          sellerOrganizationId: "b2",
          status: OrderStatus.ACCEPTED,
          paymentStatus: "UNPAID" as never,
          deliveryStatus: DeliveryStatus.FAILED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      orgGeo: new Map([
        ["b1", "SN/A"],
        ["b2", "SN/B"],
      ]),
      groupSessions: [],
      economicStates: [],
      economicSignals: [],
      deliveryThreadIds: [],
      deliveryMessageVolume: 0,
      shipments: [],
    };
    const out = svc.build(snap as never, true);
    expect(out.rows[0]?.instability).toBeGreaterThan(0.2);
  });
});

describe("Instruction 15 — intervention ranking", () => {
  it("sorts by finalScore descending", () => {
    const svc = new SupplyInterventionsService();
    const now = new Date().toISOString();
    const overview = {
      generatedAt: now,
      organizationId: DEMO_ORG,
      policy: "ACTIVE" as const,
      activeShipments: 10,
      delayedShipments: 8,
      unstableTerritories: 4,
      routeCongestionIndex: 0.7,
      warehousePressureIndex: 0.65,
      loadingDelayIndex: 0.5,
      fulfillmentConfidence: 0.35,
      downstreamSupplyQuality: 0.4,
      territoryInstability: 0.55,
      routeExecutionConfidence: 0.4,
      movementStrips: [],
      edgeReadiness: {
        desktopEdgeSync: "PLANNED" as const,
        offlineRouteSync: "PLANNED" as const,
        intermittentConnectivityMode: "SUPPORTED_VIA_ADAPTIVE_UI" as const,
        localRouteCacheSchemaVersion: 1,
        routeTelemetry: { status: "NOT_CONFIGURED" as const, note: "" },
      },
    };
    const out = svc.synthesize({
      organizationId: DEMO_ORG,
      generatedAt: now,
      overview,
      territoryFlow: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        cells: [{ territoryKey: "SN/X", label: "x", flowPressure: 0.8, collapseRisk: 0.3, burstHint: "overload", drivers: [] }],
        overloadedTerritories: ["SN/X"],
        weakSupplyTerritories: [],
      },
      routes: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        overloadedRoutes: ["a→b"],
        congestionClusters: 4,
        rows: [{ corridorKey: "a→b", label: "x", loadFactor: 0.5, instability: 0.4, delayCorridor: true, bottleneck: true, activeShipments: 3, recurringFailureHint: 0.4 }],
        telemetryNote: "",
      },
      warehouse: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        overloadedHubs: ["hub"],
        rows: [],
      },
      loading: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        loadingDelayCount: 5,
        unloadingInstabilityCount: 1,
        queueCongestionScore: 0.6,
        rows: [],
      },
      delay: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        recurringDelayScore: 0.5,
        congestionEscalation: 0.4,
        routeInstability: 0.5,
        territoryCollapseRisk: 0.55,
        abnormalLatencyIndex: 0.5,
        hotspots: [],
      },
      shipmentHealth: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        healthyCount: 2,
        delayedCount: 1,
        unstableCount: 0,
        blockedCount: 0,
        suspiciousCount: 0,
        rows: [],
      },
      riskMatrix: { generatedAt: now, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [] },
      fulfillmentStability: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        stabilityScore: 0.55,
        executionVariance: 0.2,
        downstreamCoherence: 0.5,
        bands: [],
      },
    });
    for (let i = 0; i < out.interventions.length - 1; i++) {
      expect((out.interventions[i].finalScore ?? 0) >= (out.interventions[i + 1].finalScore ?? 0)).toBe(true);
    }
  });
});

describe("Instruction 15 — logistics briefing tone", () => {
  it("uses logistics_command tone", () => {
    const gw = new BackofficeAiGatewayService({ append: async () => ({}) } as never);
    const out = gw.generateSupplyLogisticsBriefing({
      activeShipments: 5,
      delayedShipments: 2,
      routeCongestionIndex: 0.4,
      warehousePressureIndex: 0.35,
      loadingDelayIndex: 0.3,
      fulfillmentConfidence: 0.6,
      territoryInstability: 0.35,
      unstableTerritories: 1,
      dataSources: ["unit"],
    });
    expect(out.tone).toBe("logistics_command");
    expect(out.policy).toBe("ACTIVE");
  });
});
