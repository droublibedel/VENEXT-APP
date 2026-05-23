import { describe, expect, it } from "vitest";
import { DeliveryStatus, OrderStatus } from "@prisma/client";

import { ShipmentHealthService } from "./shipment-health/shipment-health.service";
import { SupplyInterventionsService } from "./supply-interventions/supply-interventions.service";
import { isActiveShipmentProxy } from "./supply-logistics-intelligence/supply-overview.service";

const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

describe("Instruction 15A — active shipment proxy semantics", () => {
  it("excludes DRAFT from active shipment proxy", () => {
    expect(
      isActiveShipmentProxy({ status: OrderStatus.DRAFT, deliveryStatus: DeliveryStatus.NOT_STARTED }),
    ).toBe(false);
  });

  it("excludes COMPLETED + DELIVERED", () => {
    expect(
      isActiveShipmentProxy({ status: OrderStatus.COMPLETED, deliveryStatus: DeliveryStatus.DELIVERED }),
    ).toBe(false);
  });

  it("includes SUBMITTED", () => {
    expect(isActiveShipmentProxy({ status: OrderStatus.SUBMITTED, deliveryStatus: DeliveryStatus.NOT_STARTED })).toBe(
      true,
    );
  });
});

describe("Instruction 15A — interventions", () => {
  it("emits reduce_delay_propagation when delay radar is critical", () => {
    const svc = new SupplyInterventionsService();
    const now = new Date().toISOString();
    const overview = {
      generatedAt: now,
      organizationId: DEMO_ORG,
      policy: "ACTIVE" as const,
      activeShipments: 4,
      delayedShipments: 2,
      unstableTerritories: 1,
      routeCongestionIndex: 0.3,
      warehousePressureIndex: 0.3,
      loadingDelayIndex: 0.2,
      fulfillmentConfidence: 0.7,
      downstreamSupplyQuality: 0.6,
      territoryInstability: 0.2,
      routeExecutionConfidence: 0.65,
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
        telemetryNote: "",
      },
      warehouse: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        overloadedHubs: [],
        rows: [
          {
            hubKey: "SN/DAKAR",
            hubCode: "HUB:31111111",
            territory: "SN/Dakar",
            label: "Hub",
            source: "ORDER_PROXY",
            queuePressure: 0.4,
            confidence: 0.55,
            saturation: 0.4,
            dispatchBottleneck: 0.3,
            queueInstability: 0.3,
            inventoryPressure: 0.2,
            openDispatchCount: 2,
          },
        ],
      },
      loading: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        loadingDelayCount: 0,
        unloadingInstabilityCount: 0,
        queueCongestionScore: 0.1,
        rows: [],
      },
      delay: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        recurringDelayScore: 0.65,
        congestionEscalation: 0.2,
        routeInstability: 0.5,
        territoryCollapseRisk: 0.1,
        abnormalLatencyIndex: 0.62,
        hotspots: [{ key: "SN_DAKAR→CI_ABIDJAN", label: "x", intensity: 0.8 }],
      },
      riskMatrix: { generatedAt: now, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [] },
      fulfillmentStability: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        stabilityScore: 0.7,
        executionVariance: 0.1,
        downstreamCoherence: 0.65,
        bands: [],
      },
    });
    expect(out.interventions.some((i) => i.kind === "reduce_delay_propagation")).toBe(true);
  });

  it("emits supervise_unstable_hub when hub pressure is critical", () => {
    const svc = new SupplyInterventionsService();
    const now = new Date().toISOString();
    const overview = {
      generatedAt: now,
      organizationId: DEMO_ORG,
      policy: "ACTIVE" as const,
      activeShipments: 4,
      delayedShipments: 0,
      unstableTerritories: 0,
      routeCongestionIndex: 0.2,
      warehousePressureIndex: 0.7,
      loadingDelayIndex: 0.1,
      fulfillmentConfidence: 0.7,
      downstreamSupplyQuality: 0.6,
      territoryInstability: 0.2,
      routeExecutionConfidence: 0.65,
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
        telemetryNote: "",
      },
      warehouse: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        overloadedHubs: ["SN/DAKAR"],
        rows: [
          {
            hubKey: "SN/DAKAR",
            hubCode: "HUB:31111111",
            territory: "SN/Dakar",
            label: "Hub",
            source: "ORDER_PROXY",
            queuePressure: 0.7,
            confidence: 0.6,
            saturation: 0.62,
            dispatchBottleneck: 0.4,
            queueInstability: 0.58,
            inventoryPressure: 0.3,
            openDispatchCount: 6,
          },
        ],
      },
      loading: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        loadingDelayCount: 0,
        unloadingInstabilityCount: 0,
        queueCongestionScore: 0.1,
        rows: [],
      },
      delay: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        recurringDelayScore: 0.1,
        congestionEscalation: 0.1,
        routeInstability: 0.1,
        territoryCollapseRisk: 0.1,
        abnormalLatencyIndex: 0.1,
        hotspots: [],
      },
      riskMatrix: { generatedAt: now, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [] },
      fulfillmentStability: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        stabilityScore: 0.7,
        executionVariance: 0.1,
        downstreamCoherence: 0.65,
        bands: [],
      },
    });
    expect(out.interventions.some((i) => i.kind === "supervise_unstable_hub")).toBe(true);
  });
});

describe("Instruction 15A — shipment health", () => {
  it("detects partial fulfillment and suspicious behavior in order-proxy mode", () => {
    const svc = new ShipmentHealthService();
    const now = new Date();
    const old = new Date(now.getTime() - 50 * 3600000);
    const snap = {
      organizationId: DEMO_ORG,
      generatedAt: now.toISOString(),
      orders: [
        {
          id: "81111111-1111-1111-1111-111111111101",
          buyerOrganizationId: "31111111-1111-1111-1111-111111111102",
          sellerOrganizationId: DEMO_ORG,
          relationshipId: "61111111-1111-1111-1111-111111111099",
          status: OrderStatus.PARTIALLY_ACCEPTED,
          paymentStatus: "UNPAID" as never,
          deliveryStatus: DeliveryStatus.NOT_STARTED,
          createdAt: old,
          updatedAt: old,
        },
        {
          id: "81111111-1111-1111-1111-111111111102",
          buyerOrganizationId: "31111111-1111-1111-1111-111111111102",
          sellerOrganizationId: DEMO_ORG,
          relationshipId: "61111111-1111-1111-1111-111111111099",
          status: OrderStatus.SUBMITTED,
          paymentStatus: "UNPAID" as never,
          deliveryStatus: DeliveryStatus.NOT_STARTED,
          createdAt: old,
          updatedAt: new Date(now.getTime() - 40 * 3600000),
        },
      ],
      orgGeo: new Map([
        [DEMO_ORG, "SN/Dakar"],
        ["31111111-1111-1111-1111-111111111102", "CI/Abidjan"],
      ]),
      groupSessions: [],
      economicStates: [],
      economicSignals: [],
      deliveryThreadIds: [],
      deliveryMessageVolume: 0,
      shipments: [],
    };
    const out = svc.build(snap as never, true);
    const partial = out.rows.find((r) => r.orderId === "81111111-1111-1111-1111-111111111101");
    expect(partial?.partialFulfillment).toBe(true);
    const suspicious = out.rows.find((r) => r.orderId === "81111111-1111-1111-1111-111111111102");
    expect(suspicious?.suspiciousBehavior).toBe(true);
    expect(out.suspiciousCount).toBeGreaterThan(0);
  });
});
