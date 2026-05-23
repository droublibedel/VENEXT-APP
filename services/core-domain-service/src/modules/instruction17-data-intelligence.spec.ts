import { describe, expect, it, vi } from "vitest";
import { PaymentStatus, ShipmentStatus, WalletStatus } from "@prisma/client";
import { DataIntelligenceBundleResponseSchema } from "@venext/shared-contracts";
import { DomainRealtimeFanoutClient } from "./domain-realtime/domain-realtime-fanout.client";
import { EconomicOntologyService } from "./data-intelligence/economic-ontology/economic-ontology.service";
import { DecisionSimulationService } from "./data-intelligence/decision-simulation/decision-simulation.service";
import { IntelligenceInterventionsService } from "./data-intelligence/intelligence-interventions/intelligence-interventions.service";
import { territoryNormalizedCodeFromOrg } from "./supply-logistics-intelligence/territory-code-normalizer";

describe("Instruction 17 — data intelligence bundle zod integrity", () => {
  it("parses a representative bundle shape", () => {
    const raw = {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId: "31111111-1111-1111-1111-111111111101",
      overview: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        economicPropagationScore: 0.4,
        activeCorrelations: 2,
        openAnomalies: 1,
        predictiveHighRisk: 0.3,
        dataQualityGuardianReadiness: 0.7,
        headline: "test",
      },
      ontology: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        graphDensity: 0.2,
        poleConnectivity: { order_adv: 0.5 },
        dependencyChains: [],
        cascadingImpacts: [],
        economicPropagationScore: 0.3,
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
      correlations: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        rows: [],
        summary: "s",
      },
      anomalies: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        anomalies: [],
      },
      predictiveSignals: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "DISABLED",
        signals: [],
      },
      territoryIntelligence: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        fragileTerritories: [],
        crossPoleStress: 0.1,
        narrative: "n",
      },
      graphIntelligence: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "DISABLED",
        networkStress: 0,
        clusterHealth: 0,
        orphanEdges: 0,
        trustCompression: 0,
        narrative: "n",
      },
      decisionSimulation: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        scenarios: [],
      },
      economicScore: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        organizationEconomicScore: { score: 0.5, explanation: "e", sources: ["s"] },
        territoryEconomicScore: { score: 0.5, explanation: "e", sources: ["s"] },
        networkResilienceScore: { score: 0.5, explanation: "e", sources: ["s"] },
        liquidityStressScore: { score: 0.5, explanation: "e", sources: ["s"] },
        fulfillmentReliabilityScore: { score: 0.5, explanation: "e", sources: ["s"] },
        relationshipTrustScore: { score: 0.5, explanation: "e", sources: ["s"] },
      },
      dataQuality: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        issues: [],
        guardianReadiness: 0.9,
      },
      briefing: {
        provider: "MockAIProvider",
        providerMode: "MOCK_PROVIDER",
        realLLMConnected: false,
        mockContextUsed: true,
        policy: "ACTIVE",
        title: "t",
        executiveSummary: "e",
        weakSignals: [],
        systemicTensions: [],
        futureRisks: [],
        hiddenOpportunities: [],
        criticalAnomalies: [],
        economicDependencies: [],
        confidence: 0.7,
        dataSources: ["unit"],
        tone: "economic_superintelligence",
        note: "n",
      },
      interventions: { version: "1", generatedAt: new Date().toISOString(), organizationId: "31111111-1111-1111-1111-111111111101", interventions: [] },
    };
    const p = DataIntelligenceBundleResponseSchema.safeParse(raw);
    expect(p.success).toBe(true);
  });
});

describe("Instruction 17 — ontology propagation narrative", () => {
  it("returns propagation narrative when enabled", () => {
    const svc = new EconomicOntologyService();
    const snap = {
      organizationId: "o",
      generatedAt: "t",
      commercial: { relationships: [{ id: "1" }] },
      finance: { orders: [], wallets: [], negotiations: [], transactions: [], groupBuyingSessions: [] },
      orderAdv: { orders: [], negotiations: [], threads: [], groupSessions: [], economicStates: [], reservationIntents: [], orgGeo: new Map(), messageCountByThread: new Map(), latestMessagesByThread: new Map() },
      supply: { orders: [], shipments: [], groupSessions: [], economicStates: [], economicSignals: [], orgGeo: new Map(), deliveryThreadIds: [], deliveryMessageVolume: 0 },
      economicSignals7d: 3,
      strategicSummary: { available: false, source: "unit", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      marketingSummary: { available: false, source: "unit", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      negotiationMetrics: { openNegotiationsCount: 0, stalledNegotiationsCount: 0, totalNegotiationsCount: 0 },
      graphTraversal: { visitedCount: 0, exploredEdges: 0, truncated: false },
    } as never;
    const out = svc.build(snap, true);
    expect(out.orderFailureImpactNarrative.length).toBeGreaterThan(40);
    expect(out.economicPropagationScore).toBeGreaterThanOrEqual(0);
  });
});

describe("Instruction 17 — decision simulation tradeoffs", () => {
  it("prescribes margin vs territory tradeoff when simulation enabled", () => {
    const svc = new DecisionSimulationService();
    const snap = {
      finance: {
        orders: [{ paymentStatus: PaymentStatus.UNPAID, totalAmount: 12_000_000 }],
        wallets: [{ balance: 2_000_000, status: WalletStatus.LIMITED }],
      },
      supply: { shipments: [{ shipmentStatus: ShipmentStatus.DELAYED }] },
      commercial: { relationships: [] },
      strategicSummary: { available: false, source: "unit", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      marketingSummary: { available: false, source: "unit", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      negotiationMetrics: { openNegotiationsCount: 0, stalledNegotiationsCount: 0, totalNegotiationsCount: 0 },
      graphTraversal: { visitedCount: 0, exploredEdges: 0, truncated: false },
    } as unknown as import("./data-intelligence/data-intelligence-data.service").DataIntelligenceCrossCutSnapshot;
    const out = svc.build(snap, true, true);
    expect(out.acceptOrderSimulation?.tradeoffs.some((t) => t.dimension === "margin")).toBe(true);
    expect(out.acceptOrderSimulation?.liquidityImpact).toBeGreaterThan(0.1);
    expect(out.acceptOrderSimulation?.tradeoffs.find((t) => t.dimension === "liquidity")?.prescription).toMatch(/Trésorerie/i);
  });
});

describe("Instruction 17 — intervention ranking", () => {
  it("sorts interventions by finalScore descending", () => {
    const svc = new IntelligenceInterventionsService();
    const snap = {
      organizationId: "o",
      generatedAt: "t",
      commercial: { relationships: Array.from({ length: 50 }, (_, i) => ({ id: `r${i}` })), partnersPack: { edges: [], counterparties: [] } },
      finance: { orders: [], wallets: [], negotiations: [], transactions: [], groupBuyingSessions: [] },
      orderAdv: { orders: [], negotiations: [], threads: [], groupSessions: [], economicStates: [], reservationIntents: [], orgGeo: new Map(), messageCountByThread: new Map(), latestMessagesByThread: new Map() },
      supply: { orders: [], shipments: Array.from({ length: 5 }, () => ({ shipmentStatus: "IN_TRANSIT" })), groupSessions: [], economicStates: [], economicSignals: [], orgGeo: new Map(), deliveryThreadIds: [], deliveryMessageVolume: 0 },
      economicSignals7d: 0,
      strategicSummary: { available: false, source: "unit", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      marketingSummary: { available: false, source: "unit", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      negotiationMetrics: { openNegotiationsCount: 0, stalledNegotiationsCount: 0, totalNegotiationsCount: 0 },
      graphTraversal: { visitedCount: 0, exploredEdges: 0, truncated: false },
    } as never;
    const out = svc.synthesize(snap, true);
    const scores = out.interventions.map((i) => i.finalScore ?? 0);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });
});

describe("Instruction 17 — territory normalizer reuse in correlations path", () => {
  it("normalizes finance geo labels", () => {
    expect(territoryNormalizedCodeFromOrg("Dakar", "SN")).toContain("SN");
  });
});

describe("Instruction 17 — realtime fanout client for data pole events", () => {
  it("posts data_intelligence domain path when configured", async () => {
    process.env.VENEXT_API_GATEWAY_INTERNAL_URL = "http://gw";
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "k";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const client = new DomainRealtimeFanoutClient();
    await client.postDomainSignal("/internal/v1/realtime/data-intelligence/domain-signal", {
      organizationId: "o",
      eventType: "live.data_intelligence.propagation.elevated",
      source: "DOMAIN_ANALYSIS",
      body: {},
    });
    expect(fetchSpy.mock.calls[0]?.[0]).toContain("data-intelligence");
    fetchSpy.mockRestore();
    delete process.env.VENEXT_API_GATEWAY_INTERNAL_URL;
    delete process.env.VENEXT_INTERNAL_REALTIME_KEY;
  });
});
