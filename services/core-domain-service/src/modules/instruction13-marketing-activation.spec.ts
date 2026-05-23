import { ForbiddenException } from "@nestjs/common";
import { OrganizationCategory } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { MarketingActivationBundleResponseSchema } from "../../../../packages/shared-contracts/dist/marketing-activation/dtos.js";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { MarketingActivationBriefingService } from "./marketing-activation-intelligence/marketing-activation-briefing.service";
import { MarketingActivationController } from "./marketing-activation-intelligence/marketing-activation.controller";
import { ActivationOpportunityMapService } from "./marketing-activation-intelligence/activation-opportunity-map.service";
import { SponsorshipPressureService } from "./sponsorship-pressure/sponsorship-pressure.service";
import { ProductMomentumService } from "./product-momentum/product-momentum.service";
import type { CommercialNetworkContext } from "./commercial-network-intelligence/commercial-network-context.service";
const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

function minimalCtx(): CommercialNetworkContext {
  return {
    organizationId: DEMO_ORG,
    generatedAt: new Date().toISOString(),
    partnersPack: {
      organizationId: DEMO_ORG,
      edges: [],
      counterparties: [],
    },
    relationships: [],
    orders30d: [],
    ordersPrev30d: [],
    negotiations30d: 0,
    messageThreads30d: 0,
  };
}

describe("Instruction 13 — marketing_activation_enabled gate", () => {
  it("throws Forbidden when flag is disabled", async () => {
    const flags = { isEnabled: vi.fn(async (k: string) => (k === "marketing_activation_enabled" ? false : true)) };
    const c = new MarketingActivationController(
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
    expect(flags.isEnabled).toHaveBeenCalledWith("marketing_activation_enabled", { organizationId: DEMO_ORG });
  });
});

describe("Instruction 13 — marketing_activation_ai_enabled briefing", () => {
  it("disables briefing when marketing_activation_ai_enabled is false", async () => {
    const flags = { isEnabled: vi.fn(async (k: string) => (k === "marketing_activation_ai_enabled" ? false : true)) };
    const gw = { generateMarketingActivationBriefing: vi.fn() };
    const svc = new MarketingActivationBriefingService(flags as never, gw as never);
    const overview = {
      generatedAt: new Date().toISOString(),
      organizationId: DEMO_ORG,
      sponsorshipPressure: 0.4,
      activationVelocity: 0.5,
      retailerEngagementLevel: 0.5,
      productMomentum: 0.5,
      campaignEffectiveness: 0.5,
      territoryStimulation: 0.5,
      inactiveActivationZones: 0,
      commercialExcitation: 0.5,
      activationConfidence: 0.6,
      signalStrips: [],
    };
    const out = await svc.briefing(DEMO_ORG, minimalCtx(), {
      overview,
      sponsorship: { generatedAt: overview.generatedAt, organizationId: DEMO_ORG, policy: "ACTIVE", engineReuse: "SponsoredInjectionEngineService" },
      territory: { generatedAt: overview.generatedAt, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [], risingCorridors: [], dormantRegions: [] },
      productMomentum: { generatedAt: overview.generatedAt, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [] },
      campaigns: {
        generatedAt: overview.generatedAt,
        organizationId: DEMO_ORG,
        layer: "ACTIVATION_CAMPAIGN_ABSTRACTION_V1",
        moduleNote: "test",
        campaigns: [],
      },
    });
    expect(out.policy).toBe("DISABLED");
    expect(gw.generateMarketingActivationBriefing).not.toHaveBeenCalled();
  });
});

describe("Instruction 13 — sponsorship engine reuse", () => {
  it("calls listActiveInjections when gates pass", async () => {
    const listActiveInjections = vi.fn().mockResolvedValue({
      items: [{ sponsor: { id: "s1", displayName: "S", commercialId: "c", country: "SN", city: "Dakar" }, product: { id: "p1", name: "P", category: "x", currency: "XOF", organizationId: "o" } }],
      page: { limit: 120, hasMore: false, nextCursor: null, projection: "summary" },
    });
    const flags = {
      isEnabled: vi.fn(async (k: string) =>
        ["marketing_activation_enabled", "sponsorship_pressure_enabled", "sponsorship_observatory_enabled"].includes(k),
      ),
    };
    const relationalFlags = { isEnabled: vi.fn(async (k: string) => k === "sponsored_products_enabled") };
    const svc = new SponsorshipPressureService({ listActiveInjections } as never, flags as never, relationalFlags as never);
    const out = await svc.fromContext(minimalCtx(), null);
    expect(listActiveInjections).toHaveBeenCalled();
    expect(out.policy).toBe("ACTIVE");
    expect(out.engineReuse).toBe("SponsoredInjectionEngineService");
  });
});

describe("Instruction 13 — product momentum uses order-derived rows", () => {
  it("returns policy ACTIVE with prisma-backed rows", async () => {
    const prisma = {
      orderItem: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      negotiation: { groupBy: vi.fn().mockResolvedValue([]) },
    };
    const svc = new ProductMomentumService(prisma as never);
    const out = await svc.fromContext(minimalCtx(), { items: [], page: { limit: 1, hasMore: false, nextCursor: null, projection: "summary" } }, true);
    expect(out.policy).toBe("ACTIVE");
    expect(Array.isArray(out.rows)).toBe(true);
  });
});

describe("Instruction 13 — opportunity map modes", () => {
  it("parses known modes", () => {
    const svc = new ActivationOpportunityMapService();
    expect(svc.parseMode("dormant")).toBe("dormant");
    expect(svc.parseMode("bad")).toBe("momentum");
  });

  it("returns modeComputation and sponsorship heat from injection snapshot", () => {
    const svc = new ActivationOpportunityMapService();
    const seasonal = {
      source: "MOCK_CONTEXT:stub",
      intensity: 0.2,
      affectedTerritories: ["SN/Dakar"],
      affectedCategories: [] as string[],
      confidence: 0.5,
      explanation: "MOCK_CONTEXT test",
    };
    const ctx = {
      ...minimalCtx(),
      partnersPack: {
        organizationId: DEMO_ORG,
        edges: [],
        counterparties: [{ id: "r1", category: OrganizationCategory.RETAILER, country: "SN", city: "Dakar" }],
      },
      orders30d: [],
      ordersPrev30d: [],
    } as never;
    const snapshot = {
      items: [
        {
          sponsor: { id: "s1", displayName: "S", commercialId: "c", country: "SN", city: "Dakar" },
          product: { id: "p1", name: "P", category: "x", currency: "XOF", organizationId: DEMO_ORG },
        },
        {
          sponsor: { id: "s2", displayName: "S2", commercialId: "c2", country: "SN", city: "Dakar" },
          product: { id: "p2", name: "P2", category: "x", currency: "XOF", organizationId: DEMO_ORG },
        },
      ],
      page: { limit: 120, hasMore: false, nextCursor: null, projection: "summary" as const },
    };
    const out = svc.fromContext(ctx, "sponsorship", snapshot as never, seasonal);
    expect(out.modeComputation.formulaVersion).toBe("13A_MODE_HEAT_V2");
    expect(out.modeComputation.primarySignals.join()).toContain("SponsoredInjectionEngineService");
    const cell = out.cells.find((c) => c.territoryKey === "SN/Dakar");
    expect(cell?.heat).toBeGreaterThan(0.1);
  });
});

describe("Instruction 13 — bundle contract", () => {
  it("parses minimal synthetic bundle", () => {
    const org = DEMO_ORG;
    const now = new Date().toISOString();
    const parsed = MarketingActivationBundleResponseSchema.safeParse({
      version: "1",
      generatedAt: now,
      organizationId: org,
      overview: {
        generatedAt: now,
        organizationId: org,
        sponsorshipPressure: 0.5,
        activationVelocity: 0.5,
        retailerEngagementLevel: 0.5,
        productMomentum: 0.5,
        campaignEffectiveness: 0.5,
        territoryStimulation: 0.5,
        inactiveActivationZones: 0,
        commercialExcitation: 0.5,
        activationConfidence: 0.6,
        signalStrips: [],
      },
      sponsorshipPressure: {
        generatedAt: now,
        organizationId: org,
        policy: "DISABLED",
        engineReuse: "SponsoredInjectionEngineService",
      },
      territoryRadar: { generatedAt: now, organizationId: org, policy: "ACTIVE", rows: [], risingCorridors: [], dormantRegions: [] },
      productMomentum: { generatedAt: now, organizationId: org, policy: "ACTIVE", rows: [] },
      retailerEngagement: {
        generatedAt: now,
        organizationId: org,
        policy: "ACTIVE",
        segmentCounts: { highlyEngaged: 0, weaklyEngaged: 0, dormant: 0, activationSensitive: 0, sponsorReactive: 0 },
        rows: [],
      },
      campaigns: {
        generatedAt: now,
        organizationId: org,
        layer: "ACTIVATION_CAMPAIGN_ABSTRACTION_V1",
        moduleNote: "m",
        campaigns: [],
      },
      opportunityMap: {
        generatedAt: now,
        organizationId: org,
        mode: "momentum",
        legend: "l",
        cells: [],
        controls: ["momentum", "dormant", "sponsorship", "retailer_engagement", "territory_stimulation", "activation_decay"],
        mapEngine: "MapControlEngine_layers",
      },
      briefing: { provider: "MockAIProvider", policy: "ACTIVE", title: "t" },
      interventions: { generatedAt: now, organizationId: org, interventions: [] },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("Instruction 13 — marketing realtime contract labels", () => {
  it("defines ten demo/live marketing envelope types", () => {
    const types = [
      "demo.marketing.sponsorship.spike",
      "demo.marketing.activation.burst",
      "demo.marketing.momentum.shift",
      "demo.marketing.retailer.engagement.burst",
      "demo.marketing.campaign.pressure",
      "live.marketing.sponsorship.spike",
      "live.marketing.activation.burst",
      "live.marketing.momentum.shift",
      "live.marketing.retailer.engagement.burst",
      "live.marketing.campaign.pressure",
    ];
    expect(types).toHaveLength(10);
  });
});

describe("Instruction 13 — gateway marketing briefing generation", () => {
  it("returns activation_operator tone", () => {
    const gw = new BackofficeAiGatewayService({ append: async () => ({}) } as never);
    const out = gw.generateMarketingActivationBriefing({
      sponsorshipPressure: 0.5,
      activationVelocity: 0.6,
      dormantTerritories: ["SN/X"],
      risingProductsSample: 2,
      weakCampaigns: 1,
      retailerEngagementPulse: 0.55,
      seasonalIntensity: 0.2,
      seasonalExplanation: "MOCK_CONTEXT unit",
      seasonalAffectedTerritories: ["SN/Dakar"],
      dataSources: ["unit"],
    });
    expect(out.tone).toBe("activation_operator");
    expect(out.policy).toBe("ACTIVE");
  });
});
