import { describe, expect, it, vi } from "vitest";
import {
  CommercialNetworkBundleResponseSchema,
  COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN,
} from "../../../../packages/shared-contracts/dist/commercial-network/dtos.js";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { RetailerRadarService } from "./retailer-radar/retailer-radar.service";
import { SponsorshipObservatoryService } from "./sponsorship-observatory/sponsorship-observatory.service";
import type { CommercialNetworkContext } from "./commercial-network-intelligence/commercial-network-context.service";

function minimalCtx(overrides: Partial<CommercialNetworkContext> = {}): CommercialNetworkContext {
  const base: CommercialNetworkContext = {
    organizationId: "31111111-1111-1111-1111-111111111101",
    generatedAt: new Date().toISOString(),
    partnersPack: {
      organizationId: "31111111-1111-1111-1111-111111111101",
      edges: [],
      counterparties: [],
    },
    relationships: [],
    orders30d: [],
    ordersPrev30d: [],
    negotiations30d: 0,
    messageThreads30d: 0,
  };
  return { ...base, ...overrides };
}

describe("Instruction 12 — MockAI commercial briefing", () => {
  it("returns structured CommercialBriefingResponse fields", () => {
    const audit = { append: async () => ({}) };
    const gw = new BackofficeAiGatewayService(audit as never);
    const out = gw.generateCommercialNetworkBriefing({
      activeWholesalers: 3,
      unstableWholesalers: 1,
      inactiveRegions: ["SN/Thiès"],
      commercialConfidence: 0.71,
      negotiationActivityLevel: 0.42,
      acceptanceRate: 0.65,
      dataSources: ["unit"],
    });
    expect(out.provider).toBe("MockAIProvider");
    expect(out.policy).toBe("ACTIVE");
    expect(out.title).toContain("Commercial network");
    expect(out.anomalies?.length).toBeGreaterThan(0);
    expect(typeof out.confidence).toBe("number");
  });
});

describe("Instruction 12 — retailer radar flag", () => {
  it("returns DISABLED policy when retailer_radar_enabled is false", async () => {
    const svc = new RetailerRadarService({} as never);
    const out = await svc.fromContext(minimalCtx(), false);
    expect(out.policy).toBe("DISABLED");
    expect(out.rows).toEqual([]);
  });
});

describe("Instruction 12 — sponsorship engine reuse", () => {
  it("delegates to SponsoredInjectionEngineService.listActiveInjections", async () => {
    const sponsored = {
      listActiveInjections: vi.fn().mockResolvedValue({
        items: [
          { sponsor: { country: "SN", city: "Dakar" }, maxRelationshipDepth: 2 },
          { sponsor: { country: "SN", city: "Thiès" }, maxRelationshipDepth: 2 },
        ],
        page: { limit: 80, hasMore: false, nextCursor: null, projection: "summary" },
      }),
    };
    const svc = new SponsorshipObservatoryService(sponsored as never);
    const ctx = minimalCtx();
    const out = await svc.fromContext(ctx, true);
    expect(sponsored.listActiveInjections).toHaveBeenCalled();
    expect(out.engineReuse).toBe("SponsoredInjectionEngineService");
    expect(out.policy).toBe("ACTIVE");
    expect(out.activeInjectionsSample).toBe(2);
  });
});

describe("Instruction 12 — bundle contract", () => {
  it("parses minimal synthetic bundle", () => {
    const org = "31111111-1111-1111-1111-111111111101";
    const now = new Date().toISOString();
    const parsed = CommercialNetworkBundleResponseSchema.safeParse({
      version: "1",
      generatedAt: now,
      organizationId: org,
      overview: {
        generatedAt: now,
        organizationId: org,
        activeWholesalers: 1,
        unstableWholesalers: 0,
        retailerGrowthVelocity: 0,
        inactiveRegions: [],
        networkExpansionVelocity: 0,
        relationshipAcceptanceRate: 0.8,
        commercialConfidence: 0.7,
        sponsorshipInfluenceDensity: 0.1,
        negotiationActivityLevel: 0.2,
        signalStrips: [],
      },
      relationships: {
        generatedAt: now,
        organizationId: org,
        acceptedCount: 1,
        pendingInvitations: 0,
        unstableRelationships: 0,
        suspendedRelationships: 0,
        qrRelationshipGrowth30d: 0,
        contactSyncRelationshipGrowth30d: 0,
        trustEvolution: { trend: "flat", delta: 0 },
        commercialDependencyScore: 0.5,
        relationshipStrengthIndex: 0.6,
        graphReuse: COMMERCIAL_NETWORK_RELATIONSHIPS_GRAPH_REUSE_TOKEN,
      },
      distributors: { generatedAt: now, organizationId: org, rows: [] },
      retailers: {
        generatedAt: now,
        organizationId: org,
        segmentSummary: { active: 0, inactive: 0, rising: 0, regionalPressure: 0, other: 0 },
        groupBuyingSignals: { available: true, sessions30d: 0, relationshipScopedSessions30d: 0 },
        rows: [],
      },
      expansionMap: {
        generatedAt: now,
        organizationId: org,
        mode: "growth",
        legend: "x",
        cells: [],
        controls: [
          "growth",
          "weak_network",
          "sponsorship",
          "retailer_pressure",
          "distributor_density",
          "inactive_territory",
        ],
        mapEngine: "MapControlEngine_layers",
      },
      stabilityMatrix: { generatedAt: now, organizationId: org, rows: [] },
      sponsorship: {
        generatedAt: now,
        organizationId: org,
        policy: "DISABLED",
        engineReuse: "SponsoredInjectionEngineService",
      },
      briefing: {
        provider: "MockAIProvider",
        policy: "ACTIVE",
        title: "t",
        executiveSummary: "s",
        anomalies: [],
        opportunities: [],
        recommendedActions: [],
        confidence: 0.5,
        dataSources: [],
      },
      interventions: { generatedAt: now, organizationId: org, interventions: [] },
    });
    expect(parsed.success).toBe(true);
  });
});
