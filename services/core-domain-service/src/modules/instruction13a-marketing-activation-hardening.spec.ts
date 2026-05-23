import { OrganizationCategory } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ActivationInterventionsService } from "./activation-interventions/activation-interventions.service";
import { ActivationOpportunityMapService } from "./marketing-activation-intelligence/activation-opportunity-map.service";
import { MarketingActivationBundleService } from "./marketing-activation-intelligence/marketing-activation-bundle.service";
import { MarketingExternalSignalAdapter } from "./marketing-activation-intelligence/marketing-external-signal.adapter";
import { RetailerEngagementService } from "./retailer-engagement/retailer-engagement.service";
import { TerritoryActivationRadarService } from "./territory-activation-radar/territory-activation-radar.service";
import type { CommercialNetworkContext } from "./commercial-network-intelligence/commercial-network-context.service";

const DEMO_ORG = "31111111-1111-1111-1111-111111111101";

function baseCtx(over: Partial<CommercialNetworkContext> = {}): CommercialNetworkContext {
  const now = new Date().toISOString();
  return {
    organizationId: DEMO_ORG,
    generatedAt: now,
    partnersPack: { organizationId: DEMO_ORG, edges: [], counterparties: [] },
    relationships: [],
    orders30d: [],
    ordersPrev30d: [],
    negotiations30d: 0,
    messageThreads30d: 0,
    ...over,
  };
}

const seasonal = new MarketingExternalSignalAdapter().buildSeasonalPressure(
  baseCtx({
    partnersPack: {
      organizationId: DEMO_ORG,
      edges: [],
      counterparties: [
        { id: "x", displayName: "X", commercialId: "c", category: OrganizationCategory.RETAILER, country: "SN", city: "Dakar" },
      ] as never[],
    },
    orders30d: [{ buyerOrganizationId: DEMO_ORG, sellerOrganizationId: "x", createdAt: new Date() }],
  }),
);

describe("Instruction 13A — retailer engagement batching (BATCHED_FINDMANY_V1)", () => {
  it("uses a fixed small number of Prisma findMany calls, not one loop per retailer", async () => {
    const orderFindMany = vi.fn().mockResolvedValue([]);
    const negFindMany = vi.fn().mockResolvedValue([]);
    const threadFindMany = vi.fn().mockResolvedValue([]);
    const orderItemFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      order: { findMany: orderFindMany },
      negotiation: { findMany: negFindMany },
      messageThread: { findMany: threadFindMany },
      orderItem: { findMany: orderItemFindMany },
    };
    const ctx = baseCtx({
      partnersPack: {
        organizationId: DEMO_ORG,
        edges: [],
        counterparties: [
          { id: "r1", displayName: "R1", commercialId: "c1", category: OrganizationCategory.RETAILER, country: "SN", city: "Dakar" },
          { id: "r2", displayName: "R2", commercialId: "c2", category: OrganizationCategory.RETAILER, country: "ML", city: "Bamako" },
          { id: "r3", displayName: "R3", commercialId: "c3", category: OrganizationCategory.RETAILER, country: "SN", city: "Thies" },
        ] as never[],
      },
    });
    const svc = new RetailerEngagementService(prisma as never);
    const out = await svc.fromContext(ctx, { items: [], page: { limit: 1, hasMore: false, nextCursor: null, projection: "summary" } }, true);
    expect(out.aggregationStrategy).toBe("BATCHED_FINDMANY_V1");
    expect(orderFindMany).toHaveBeenCalledTimes(1);
    expect(negFindMany).toHaveBeenCalledTimes(1);
    expect(threadFindMany).toHaveBeenCalledTimes(1);
    expect(orderItemFindMany).toHaveBeenCalledTimes(1);
  });
});

describe("Instruction 13A — territory radar seasonalPressure", () => {
  it("returns seasonalPressure on the radar payload", async () => {
    const prisma = { negotiation: { findMany: vi.fn().mockResolvedValue([]) } };
    const svc = new TerritoryActivationRadarService(prisma as never);
    const outDisabled = await svc.fromContext(baseCtx(), null, false, seasonal);
    expect(outDisabled.seasonalPressure?.source).toContain("MOCK_CONTEXT");

    const ctx = baseCtx({
      partnersPack: {
        organizationId: DEMO_ORG,
        edges: [],
        counterparties: [
          { id: "cp1", displayName: "C", commercialId: "c", category: OrganizationCategory.RETAILER, country: "SN", city: "Dakar" },
        ] as never[],
      },
      orders30d: [{ buyerOrganizationId: DEMO_ORG, sellerOrganizationId: "cp1", createdAt: new Date() }],
    });
    const out = await svc.fromContext(ctx, null, true, seasonal);
    expect(out.seasonalPressure?.intensity).toBeGreaterThanOrEqual(0);
    const row = out.rows.find((r) => r.territoryKey === "SN/Dakar");
    expect(row).toBeDefined();
  });
});

describe("Instruction 13A — opportunity map territory_stimulation", () => {
  it("marks mockContextUsed when MOCK_CONTEXT seasonal source is present", () => {
    const svc = new ActivationOpportunityMapService();
    const ctx = baseCtx({
      partnersPack: {
        organizationId: DEMO_ORG,
        edges: [],
        counterparties: [
          { id: "r1", displayName: "R", commercialId: "c", category: OrganizationCategory.RETAILER, country: "SN", city: "Dakar" },
        ] as never[],
      },
    }) as never;
    const out = svc.fromContext(ctx, "territory_stimulation", null, seasonal);
    expect(out.modeComputation.mockContextUsed).toBe(true);
    expect(out.modeComputation.primarySignals).toContain("MOCK_CONTEXT:seasonalPressure");
  });
});

describe("Instruction 13A — intervention queue ranking", () => {
  it("sorts interventions by descending finalScore", () => {
    const svc = new ActivationInterventionsService();
    const now = new Date().toISOString();
    const overview = {
      generatedAt: now,
      organizationId: DEMO_ORG,
      sponsorshipPressure: 0.4,
      activationVelocity: 0.5,
      retailerEngagementLevel: 0.2,
      productMomentum: 0.5,
      campaignEffectiveness: 0.5,
      territoryStimulation: 0.5,
      inactiveActivationZones: 0,
      commercialExcitation: 0.5,
      activationConfidence: 0.6,
      signalStrips: [],
    };
    const sponsorship = {
      generatedAt: now,
      organizationId: DEMO_ORG,
      policy: "ACTIVE" as const,
      engineReuse: "SponsoredInjectionEngineService" as const,
      overexposureIndex: 0.9,
    };
    const territory = {
      generatedAt: now,
      organizationId: DEMO_ORG,
      policy: "ACTIVE" as const,
      rows: [{ territoryKey: "SN/Dakar", label: "Dakar", stimulationScore: 0.9, orderPulse: 1, sponsorshipSpread: 8, negotiationHeat: 1, state: "saturated" as const }],
      risingCorridors: [] as string[],
      dormantRegions: ["ML/Bamako"],
      seasonalPressure: seasonal,
    };
    const productMomentum = {
      generatedAt: now,
      organizationId: DEMO_ORG,
      policy: "ACTIVE" as const,
      rows: [],
    };
    const out = svc.synthesize({
      organizationId: DEMO_ORG,
      generatedAt: now,
      overview,
      sponsorship,
      territory,
      productMomentum,
      seasonalPressure: { ...seasonal, intensity: 0.9 },
    });
    for (let i = 0; i < out.interventions.length - 1; i++) {
      const a = out.interventions[i].finalScore ?? 0;
      const b = out.interventions[i + 1].finalScore ?? 0;
      expect(a).toBeGreaterThanOrEqual(b);
    }
    expect(out.interventions[0].rankingBasis?.finalScore).toBe(out.interventions[0].finalScore);
  });
});

describe("Instruction 13A — bundle sponsored snapshot independent of pressure flag", () => {
  it("calls listActiveInjections when marketing + sponsored + observatory gates pass (no sponsorship_pressure check)", async () => {
    const listActiveInjections = vi.fn().mockResolvedValue({
      items: [],
      page: { limit: 160, hasMore: false, nextCursor: null, projection: "summary" },
    });
    const flags = {
      isEnabled: vi.fn(async (k: string) =>
        ["marketing_activation_enabled", "product_momentum_enabled", "retailer_engagement_enabled", "sponsorship_observatory_enabled"].includes(k),
      ),
    };
    const relationalFlags = { isEnabled: vi.fn(async (k: string) => k === "sponsored_products_enabled") };
    const ctx = baseCtx();
    const ctxSvc = { build: vi.fn().mockResolvedValue(ctx) };
    const sponsored = { listActiveInjections };
    const externalAdapter = { buildSeasonalPressure: vi.fn().mockReturnValue(seasonal) };
    const now = ctx.generatedAt;
    const sponsorshipSvc = {
      fromContext: vi.fn().mockResolvedValue({
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "DISABLED",
        engineReuse: "SponsoredInjectionEngineService",
      }),
    };
    const territorySvc = {
      fromContext: vi.fn().mockResolvedValue({
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        rows: [],
        risingCorridors: [],
        dormantRegions: [],
        seasonalPressure: seasonal,
      }),
    };
    const productSvc = { fromContext: vi.fn().mockResolvedValue({ generatedAt: now, organizationId: DEMO_ORG, policy: "ACTIVE", rows: [] }) };
    const retailerSvc = {
      fromContext: vi.fn().mockResolvedValue({
        generatedAt: now,
        organizationId: DEMO_ORG,
        policy: "ACTIVE",
        aggregationStrategy: "BATCHED_FINDMANY_V1",
        segmentCounts: { highlyEngaged: 0, weaklyEngaged: 0, dormant: 0, activationSensitive: 0, sponsorReactive: 0 },
        rows: [],
      }),
    };
    const campaignSvc = { fromContext: vi.fn().mockResolvedValue({ generatedAt: now, organizationId: DEMO_ORG, layer: "ACTIVATION_CAMPAIGN_ABSTRACTION_V1", moduleNote: "t", campaigns: [] }) };
    const overviewSvc = {
      fromContext: vi.fn().mockReturnValue({
        generatedAt: now,
        organizationId: DEMO_ORG,
        sponsorshipPressure: 0.35,
        activationVelocity: 0.5,
        retailerEngagementLevel: 0.5,
        productMomentum: 0.5,
        campaignEffectiveness: 0.5,
        territoryStimulation: 0.5,
        inactiveActivationZones: 0,
        commercialExcitation: 0.5,
        activationConfidence: 0.6,
        signalStrips: [],
        seasonalPressure: seasonal,
      }),
    };
    const mapSvc = {
      fromContext: vi.fn().mockReturnValue({
        generatedAt: now,
        organizationId: DEMO_ORG,
        mode: "momentum",
        legend: "l",
        cells: [],
        controls: [],
        mapEngine: "MapControlEngine_layers",
        policy: "ACTIVE",
        modeComputation: { mode: "momentum", primarySignals: [], formulaVersion: "13A_MODE_HEAT_V2", mockContextUsed: false },
      }),
    };
    const briefingSvc = {
      briefing: vi.fn().mockResolvedValue({ provider: "MockAIProvider", policy: "DISABLED", executiveSummary: "x", dataSources: [] }),
    };
    const interventionsSvc = {
      synthesize: vi.fn().mockReturnValue({ generatedAt: now, organizationId: DEMO_ORG, interventions: [] }),
    };

    const bundleSvc = new MarketingActivationBundleService(
      flags as never,
      ctxSvc as never,
      sponsored as never,
      relationalFlags as never,
      externalAdapter as never,
      overviewSvc as never,
      sponsorshipSvc as never,
      territorySvc as never,
      productSvc as never,
      retailerSvc as never,
      campaignSvc as never,
      mapSvc as never,
      briefingSvc as never,
      interventionsSvc as never,
    );

    await bundleSvc.bundle(DEMO_ORG);
    expect(listActiveInjections).toHaveBeenCalledTimes(1);
    expect(flags.isEnabled).not.toHaveBeenCalledWith("sponsorship_pressure_enabled", { organizationId: DEMO_ORG });
  });
});
