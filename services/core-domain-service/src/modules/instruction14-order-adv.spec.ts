import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { OrdersOverviewResponse } from "../../../../packages/shared-contracts/dist/order-adv/dtos.js";
import { OrderAdvBundleResponseSchema } from "../../../../packages/shared-contracts/dist/order-adv/dtos.js";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { NegotiationIntelligenceService } from "./negotiation-intelligence/negotiation-intelligence.service";
import { OrderAdvController } from "./order-adv-intelligence/order-adv.controller";
import { TransactionInterventionsService } from "./transaction-interventions/transaction-interventions.service";

const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

describe("Instruction 14 — order_adv_enabled gate", () => {
  it("throws Forbidden when flag is disabled", async () => {
    const flags = { isEnabled: vi.fn(async (k: string) => (k === "order_adv_enabled" ? false : true)) };
    const sponsored = {
      listActiveInjections: vi.fn(async () => ({
        items: [] as { product: { id: string } }[],
        page: { limit: 40, nextCursor: null, hasMore: false, projection: "standard" as const },
      })),
    };
    const c = new OrderAdvController(
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
      {} as never,
      sponsored as never,
    );
    await expect(c.overview(DEMO_ORG)).rejects.toBeInstanceOf(ForbiddenException);
    expect(flags.isEnabled).toHaveBeenCalledWith("order_adv_enabled", { organizationId: DEMO_ORG });
  });
});

describe("Instruction 14 — bundle contract", () => {
  it("parses minimal synthetic bundle", () => {
    const now = new Date().toISOString();
    const parsed = OrderAdvBundleResponseSchema.safeParse({
      version: "1",
      generatedAt: now,
      organizationId: DEMO_ORG,
      overview: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        activeOrders: 1,
        delayedOrders: 0,
        negotiationIntensity: 0.4,
        groupedBuyingActivity: 0.2,
        reservationPressure: 0.3,
        deliveryTension: 0.2,
        retailerDemandAcceleration: 0.3,
        transactionConfidence: 0.6,
        conversationalCommerceIntensity: 0.4,
        signalStrips: [],
      },
      conversationalCommerce: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        threads: [],
        commerceThroughMessagingIndex: 0.2,
      },
      negotiations: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        unstableNegotiations: 0,
        negotiationBursts24h: 0,
        rows: [],
      },
      orderPressure: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        surgeTerritories: [],
        retailerPressure: 0.3,
        distributorOverload: 0.2,
        productShortageSignals: 0,
        reservationSpike: 0.1,
        fulfillmentAnomalyScore: 0.1,
        cells: [],
      },
      groupBuying: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        activeSessions: 0,
        rows: [],
        dataSource: "GroupBuyingSession_prisma",
      },
      reservations: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        rows: [],
      },
      deliveryPriority: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        urgentDeliveries: 0,
        blockedDeliveries: 0,
        fulfillmentInstability: 0.1,
        rows: [],
      },
      advCoordination: {
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        validationQueueDepth: 0,
        pendingConfirmations: 0,
        invoiceReadiness: 0.5,
        items: [],
      },
      riskMatrix: { generatedAt: now, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [] },
      briefing: { provider: "MockAIProvider", policy: "DISABLED", executiveSummary: "x" },
      interventions: { generatedAt: now, organizationId: DEMO_ORG, interventions: [] },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("Instruction 14 — negotiation intelligence", () => {
  it("returns DISABLED when negotiation intelligence flag off", () => {
    const svc = new NegotiationIntelligenceService();
    const snap = {
      organizationId: DEMO_ORG,
      generatedAt: new Date().toISOString(),
      orders: [],
      negotiations: [],
      threads: [],
      groupSessions: [],
      economicStates: [],
      reservationIntents: [],
      orgGeo: new Map(),
      messageCountByThread: new Map(),
      latestMessagesByThread: new Map(),
    };
    const out = svc.build(snap as never, false);
    expect(out.policy).toBe("DISABLED");
  });
});

describe("Instruction 14 — intervention ranking", () => {
  it("sorts by finalScore descending", () => {
    const svc = new TransactionInterventionsService();
    const overview: OrdersOverviewResponse = {
      generatedAt: new Date().toISOString(),
      organizationId: DEMO_ORG,
      policy: "ACTIVE",
      activeOrders: 10,
      delayedOrders: 12,
      negotiationIntensity: 0.8,
      groupedBuyingActivity: 0.7,
      reservationPressure: 0.6,
      deliveryTension: 0.5,
      retailerDemandAcceleration: 0.4,
      transactionConfidence: 0.5,
      conversationalCommerceIntensity: 0.5,
      signalStrips: [],
    };
    const out = svc.synthesize({
      organizationId: DEMO_ORG,
      generatedAt: overview.generatedAt,
      overview,
      orderPressure: {
        generatedAt: overview.generatedAt,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        surgeTerritories: ["SN/Thies", "SN/Dakar"],
        retailerPressure: 0.7,
        distributorOverload: 0.5,
        productShortageSignals: 1,
        reservationSpike: 0.4,
        fulfillmentAnomalyScore: 0.35,
        cells: [
          { territoryKey: "SN/Dakar", label: "SN Dakar", pressure: 0.8, drivers: ["orders:3"] },
          { territoryKey: "SN/Thies", label: "SN Thies", pressure: 0.5, drivers: ["orders:1"] },
        ],
      },
      negotiations: {
        generatedAt: overview.generatedAt,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        unstableNegotiations: 6,
        negotiationBursts24h: 12,
        rows: [],
      },
      groupBuying: {
        generatedAt: overview.generatedAt,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        activeSessions: 2,
        rows: [
          {
            sessionId: "00000000-0000-0000-0000-000000000001",
            productId: "00000000-0000-0000-0000-000000000002",
            productName: "x",
            status: "OPEN",
            thresholdProgress: 0.1,
            participantCount: 2,
            expiresAt: new Date().toISOString(),
            pressure: 0.5,
            velocityHint: "stalled",
          },
        ],
        dataSource: "GroupBuyingSession_prisma",
      },
      reservations: {
        generatedAt: overview.generatedAt,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        rows: [{ productId: "00000000-0000-0000-0000-000000000003", productName: "p", reservedDraftUnits: 1, allocationConflictScore: 0.6, expirationPressure: 0.4, retailerReservationPressure: 0.5, intentReservedUnits: 4 }],
      },
      delivery: {
        generatedAt: overview.generatedAt,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        urgentDeliveries: 1,
        blockedDeliveries: 2,
        fulfillmentInstability: 0.55,
        rows: [],
      },
    });
    for (let i = 0; i < out.interventions.length - 1; i++) {
      expect((out.interventions[i].finalScore ?? 0) >= (out.interventions[i + 1].finalScore ?? 0)).toBe(true);
    }
    for (const it of out.interventions) {
      expect(typeof it.rankingBasis?.territoryFactor).toBe("number");
      expect(it.rankingBasis?.finalScore).toBe(it.finalScore);
    }
  });
});

describe("Instruction 14 — order ADV briefing gateway", () => {
  it("returns execution_strategist tone", () => {
    const gw = new BackofficeAiGatewayService({ append: async () => ({}) } as never);
    const out = gw.generateOrderAdvBriefing({
      activeOrders: 4,
      delayedOrders: 2,
      negotiationIntensity: 0.55,
      deliveryTension: 0.4,
      groupedBuyingActivity: 0.3,
      reservationPressure: 0.35,
      transactionConfidence: 0.62,
      conversationalCommerceIntensity: 0.44,
      negotiationsOpen: 6,
      blockedDeliveries: 1,
      dataSources: ["unit"],
    });
    expect(out.tone).toBe("execution_strategist");
    expect(out.policy).toBe("ACTIVE");
  });
});
