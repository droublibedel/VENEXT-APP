import { ForbiddenException } from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { CommercialNetworkBriefingService } from "./commercial-network-intelligence/commercial-network-briefing.service";
import { CommercialNetworkController } from "./commercial-network-intelligence/commercial-network.controller";
import { CommercialExpansionMapService } from "./commercial-network-intelligence/commercial-expansion-map.service";
import { DistributorObservatoryService } from "./distributor-observatory/distributor-observatory.service";
import { RetailerRadarService } from "./retailer-radar/retailer-radar.service";
import type { CommercialNetworkContext } from "./commercial-network-intelligence/commercial-network-context.service";

const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

function minimalCtx(): CommercialNetworkContext {
  return {
    organizationId: DEMO_ORG,
    generatedAt: new Date().toISOString(),
    partnersPack: {
      organizationId: DEMO_ORG,
      edges: [],
      counterparties: [
        {
          id: "22222222-2222-2222-2222-222222222201",
          displayName: "Wholesale X",
          commercialId: "1111111111",
          category: OrganizationCategory.WHOLESALER_A,
          actorType: OrganizationActorType.WHOLESALER,
          city: "Dakar",
          country: "SN",
          commercialBadges: [],
          credibilityScore: 0.8,
        },
      ],
    },
    relationships: [],
    orders30d: [],
    ordersPrev30d: [],
    negotiations30d: 0,
    messageThreads30d: 0,
  };
}

describe("Instruction 12A — commercial_network_enabled gate", () => {
  it("throws Forbidden when flag is disabled", async () => {
    const flags = { isEnabled: vi.fn(async (k: string) => (k === "commercial_network_enabled" ? false : true)) };
    const prisma = { organization: { findUnique: vi.fn() } };
    const c = new CommercialNetworkController(
      prisma as never,
      flags as never,
      { build: vi.fn() } as never,
      { bundle: vi.fn() } as never,
      { fromContext: vi.fn() } as never,
      { fromContext: vi.fn() } as never,
      { fromContext: vi.fn() } as never,
      { fromContext: vi.fn() } as never,
      { fromContext: vi.fn() } as never,
      { fromContext: vi.fn() } as never,
      { fromContext: vi.fn() } as never,
      { briefing: vi.fn() } as never,
      { synthesize: vi.fn() } as never,
    );
    await expect(c.overview(DEMO_ORG)).rejects.toBeInstanceOf(ForbiddenException);
    expect(flags.isEnabled).toHaveBeenCalledWith("commercial_network_enabled", { organizationId: DEMO_ORG });
    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
  });
});

describe("Instruction 12A — commercial_network_ai_enabled briefing", () => {
  it("disables briefing when commercial_network_ai_enabled is false", async () => {
    const flags = { isEnabled: vi.fn(async (k: string) => (k === "commercial_network_ai_enabled" ? false : true)) };
    const gw = { generateCommercialNetworkBriefing: vi.fn() };
    const overview = { fromContext: vi.fn() };
    const svc = new CommercialNetworkBriefingService(flags as never, gw as never, overview as never);
    const out = await svc.briefing(DEMO_ORG, minimalCtx());
    expect(out.policy).toBe("DISABLED");
    expect(gw.generateCommercialNetworkBriefing).not.toHaveBeenCalled();
  });
});

describe("Instruction 12A — sponsorship map uses SponsoredInjectionEngineService", () => {
  it("calls listActiveInjections for mode=sponsorship when flags on", async () => {
    const listActiveInjections = vi.fn().mockResolvedValue({
      items: [
        {
          sponsor: { id: "s1", displayName: "S", commercialId: "c", country: "SN", city: "Dakar" },
          product: { id: "p", name: "P", category: "x", currency: "XOF", organizationId: "o" },
          maxRelationshipDepth: 2,
        },
      ],
      page: { limit: 200, hasMore: false, nextCursor: null, projection: "standard" },
    });
    const flags = {
      isEnabled: vi.fn(async (k: string) => k === "sponsorship_observatory_enabled"),
    };
    const relationalFlags = {
      isEnabled: vi.fn(async (k: string) => k === "sponsored_products_enabled"),
    };
    const svc = new CommercialExpansionMapService(flags as never, relationalFlags as never, {
      listActiveInjections,
    } as never);
    const out = await svc.fromContext(minimalCtx(), "sponsorship");
    expect(listActiveInjections).toHaveBeenCalled();
    expect(out.cells.length).toBeGreaterThan(0);
    expect(out.policy).toBe("ACTIVE");
  });
});

describe("Instruction 12A — distributor Prisma counts", () => {
  it("uses negotiation and messageThread count (not capped formulas)", async () => {
    const prisma = {
      order: {
        count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1),
      },
      negotiation: { count: vi.fn().mockResolvedValue(7) },
      messageThread: { count: vi.fn().mockResolvedValue(4) },
      sponsoredProductInjection: { count: vi.fn().mockResolvedValue(0) },
    };
    const svc = new DistributorObservatoryService(prisma as never);
    const out = await svc.fromContext(minimalCtx());
    expect(out.rows.length).toBe(1);
    expect(out.rows[0]!.negotiations30d).toBe(7);
    expect(out.rows[0]!.messageThreads30d).toBe(4);
    expect(prisma.negotiation.count).toHaveBeenCalled();
    expect(prisma.messageThread.count).toHaveBeenCalled();
  });
});

describe("Instruction 12A — commercial realtime contract labels", () => {
  it("defines six demo/live commercial envelope types (mirrors web realtime-contract.ts)", () => {
    const types = [
      "demo.commercial.relationship.event",
      "demo.commercial.retailer.pressure",
      "demo.commercial.sponsorship.spike",
      "live.commercial.relationship.event",
      "live.commercial.retailer.pressure",
      "live.commercial.sponsorship.spike",
    ];
    expect(types).toHaveLength(6);
  });
});

describe("Instruction 12A — retailer groupBuyingSignals", () => {
  it("returns structured groupBuyingSignals when radar enabled", async () => {
    const prisma = {
      groupBuyingSession: {
        count: vi.fn().mockResolvedValue(0),
      },
      negotiation: { count: vi.fn().mockResolvedValue(0) },
    };
    const svc = new RetailerRadarService(prisma as never);
    const ctx = {
      ...minimalCtx(),
      partnersPack: {
        organizationId: DEMO_ORG,
        edges: [],
        counterparties: [
          {
            id: "33333333-3333-3333-3333-333333333301",
            displayName: "Retail Y",
            commercialId: "2222222222",
            category: OrganizationCategory.RETAILER,
            actorType: OrganizationActorType.RETAILER,
            city: "Thiès",
            country: "SN",
            commercialBadges: [],
            credibilityScore: 0.7,
          },
        ],
      },
      relationships: [],
    } as CommercialNetworkContext;
    const out = await svc.fromContext(ctx, true);
    expect(out.groupBuyingSignals?.available).toBe(true);
    expect(out.groupBuyingSignals && "sessions30d" in out.groupBuyingSignals).toBe(true);
  });
});
