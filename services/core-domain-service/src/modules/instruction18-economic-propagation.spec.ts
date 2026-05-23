import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PaymentStatus, ShipmentStatus, WalletStatus } from "@prisma/client";
import { EconomicPropagationBundleSchema } from "@venext/shared-contracts";
import { DomainRealtimeFanoutClient } from "./domain-realtime/domain-realtime-fanout.client";
import { CrossPoleImpactService } from "./economic-propagation/cross-pole-impact.service";
import { EconomicPropagationEngineService } from "./economic-propagation/economic-propagation-engine.service";
import { EconomicPropagationRealtimePublishService } from "./economic-propagation/economic-propagation-realtime-publish.service";
import { EconomicShockService } from "./economic-propagation/economic-shock.service";
import { PropagationRuleEngineService } from "./economic-propagation/propagation-rule-engine.service";
import { PropagationSimulationService } from "./economic-propagation/propagation-simulation.service";
import { parseEconomicPropagationSimulationQuery } from "./economic-propagation/economic-propagation-simulation-query";
import { TerritoryFragilityService } from "./economic-propagation/territory-fragility.service";
import type { EconomicPropagationSnapshot } from "./economic-propagation/economic-propagation-engine.service";

function baseSnap(over?: Partial<EconomicPropagationSnapshot>): EconomicPropagationSnapshot {
  const core = {
    organizationId: "31111111-1111-1111-1111-111111111101",
    generatedAt: new Date().toISOString(),
    commercial: { relationships: Array.from({ length: 80 }, (_, i) => ({ id: `r${i}`, trustLevel: i % 5 === 0 ? 0.3 : 0.8 })), partnersPack: { edges: [], counterparties: [] } },
    finance: {
      organizationId: "31111111-1111-1111-1111-111111111101",
      generatedAt: new Date().toISOString(),
      orders: Array.from({ length: 30 }, (_, i) => ({
        id: `o${i}`,
        buyerOrganizationId: "b",
        relationshipId: "rel",
        totalAmount: 1_000_000,
        currency: "XOF",
        paymentStatus: i < 8 ? PaymentStatus.UNPAID : PaymentStatus.PAID,
        status: "CONFIRMED" as never,
        deliveryStatus: "OK",
        createdAt: new Date(),
        updatedAt: new Date(),
        buyer: { id: "b", displayName: "x", city: "Dakar", country: "SN", credibilityScore: 0.5, category: "R" },
        relationship: { id: "rel", trustLevel: 0.5, status: "ACTIVE" },
      })),
      negotiations: [],
      wallets: [{ organizationId: "x", currency: "XOF", balance: 1_000_000, status: WalletStatus.LIMITED, qrPayload: "", nfcEnabled: false }],
      transactions: [],
      groupBuyingSessions: [],
    },
    orderAdv: {
      orders: Array.from({ length: 40 }, () => ({ id: "x" })),
      negotiations: Array.from({ length: 10 }, () => ({ status: "OPEN" as never })),
      threads: [],
      groupSessions: [],
      economicStates: [],
      reservationIntents: [],
      orgGeo: new Map(),
      messageCountByThread: new Map(),
      latestMessagesByThread: new Map(),
    },
    supply: {
      orders: Array.from({ length: 20 }, () => ({ id: "s" })),
      shipments: [
        { shipmentStatus: ShipmentStatus.DELAYED },
        { shipmentStatus: ShipmentStatus.BLOCKED },
        ...Array.from({ length: 8 }, () => ({ shipmentStatus: ShipmentStatus.IN_TRANSIT })),
      ],
      groupSessions: [],
      economicStates: [],
      economicSignals: [],
      orgGeo: new Map([["hub1", "SN / Dakar"]]),
      deliveryThreadIds: [],
      deliveryMessageVolume: 0,
    },
    economicSignals7d: 12,
    strategicSummary: { available: true, source: "u", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: ["SN_DAKAR"], confidence: 0.62, metrics: { pressure: 0.4 } },
    marketingSummary: {
      available: true,
      source: "u",
      keySignals: [],
      riskSignals: [],
      opportunitySignals: [],
      territorySignals: ["SN_DAKAR"],
      confidence: 0.55,
      metrics: { territoryStimulation: 0.55, campaignEffectiveness: 0.35 },
    },
    negotiationMetrics: { openNegotiationsCount: 8, stalledNegotiationsCount: 0, totalNegotiationsCount: 10 },
    graphTraversal: { visitedCount: 120, exploredEdges: 400, truncated: true },
  } as unknown as import("./data-intelligence/data-intelligence-data.service").DataIntelligenceCrossCutSnapshot;
  return {
    ...core,
    dataIntelligence: { available: false, source: "SOURCE_NOT_AVAILABLE", reason: "unit_test" },
    ...over,
  };
}

describe("Instruction 18.1 — economic propagation", () => {
  it("parses bundle zod", () => {
    const snap = baseSnap();
    const shocks = new EconomicShockService().detect(snap);
    const rules = new PropagationRuleEngineService();
    const territory = new TerritoryFragilityService();
    const cross = new CrossPoleImpactService();
    const sim = new PropagationSimulationService(new EconomicShockService(), rules, territory, cross);
    const chains = shocks.slice(0, 3).map((s) => rules.buildPropagationChain(s, snap));
    const raw = {
      version: "1" as const,
      generatedAt: snap.generatedAt,
      organizationId: snap.organizationId,
      overview: {
        version: "1" as const,
        generatedAt: snap.generatedAt,
        organizationId: snap.organizationId,
        policy: "ACTIVE" as const,
        headline: "t",
        systemicRiskRollup: 0.4,
        shockCount: shocks.length,
        chainCount: chains.length,
        territoryFragileTop: 1,
      },
      shocks,
      chains,
      territoryFragility: territory.build(snap),
      simulationPreview: sim.previewFromSnapshot(snap),
    };
    expect(EconomicPropagationBundleSchema.safeParse(raw).success).toBe(true);
  });

  it("shocks are derived from snapshot signals", () => {
    const shocks = new EconomicShockService().detect(baseSnap());
    expect(shocks.length).toBeGreaterThan(0);
    expect(shocks.every((s) => s.sourceSignals.length > 0)).toBe(true);
  });

  it("propagation chain hits multiple poles", () => {
    const snap = baseSnap();
    const sh = new EconomicShockService().detect(snap).find((x) => x.type === "shipment_delayed");
    expect(sh).toBeTruthy();
    const chain = new PropagationRuleEngineService().buildPropagationChain(sh!, snap);
    expect(new Set(chain.impacts.map((i) => i.targetPole)).size).toBeGreaterThanOrEqual(2);
  });

  it("territory fragility scores bounded 0–1", () => {
    const rows = new TerritoryFragilityService().build(baseSnap());
    for (const r of rows) {
      expect(r.fragilityScore).toBeGreaterThanOrEqual(0);
      expect(r.fragilityScore).toBeLessThanOrEqual(1);
      expect(r.resilienceScore).toBeGreaterThanOrEqual(0);
      expect(r.resilienceScore).toBeLessThanOrEqual(1);
    }
  });

  it("simulation respects triggerType", () => {
    const snap = baseSnap();
    const rules = new PropagationRuleEngineService();
    const territory = new TerritoryFragilityService();
    const cross = new CrossPoleImpactService();
    const sim = new PropagationSimulationService(new EconomicShockService(), rules, territory, cross);
    const a = sim.run(snap, { triggerType: "network_saturation" });
    const b = sim.run(snap, { triggerType: "payment_instability" });
    expect(a.triggerType).toBe("network_saturation");
    expect(b.triggerType).toBe("payment_instability");
    expect(a.systemicRiskScore).not.toBe(b.systemicRiskScore);
  });

  it("unavailable dataIntelligence is not faked as available", () => {
    const snap = baseSnap();
    expect(snap.dataIntelligence.available).toBe(false);
    expect(snap.dataIntelligence.source).toBe("SOURCE_NOT_AVAILABLE");
  });

  it("realtime fanout posts economic-propagation path", async () => {
    process.env.VENEXT_API_GATEWAY_INTERNAL_URL = "http://gw";
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "k";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const client = new DomainRealtimeFanoutClient();
    await client.postDomainSignal("/internal/v1/realtime/economic-propagation/domain-signal", {
      organizationId: "o",
      eventType: "live.economic_propagation.shock.detected",
      source: "DOMAIN_ANALYSIS",
      body: {},
    });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("economic-propagation");
    fetchSpy.mockRestore();
    delete process.env.VENEXT_API_GATEWAY_INTERNAL_URL;
    delete process.env.VENEXT_INTERNAL_REALTIME_KEY;
  });

  it("compose respects shock + cross-pole flags", async () => {
    const flags = {
      isEnabled: vi.fn(async (k: string) => {
        if (k === "economic_shock_detection_enabled") return false;
        if (k === "cross_pole_propagation_enabled") return false;
        if (k === "propagation_simulation_enabled") return false;
        if (k === "data_intelligence_enabled") return false;
        return true;
      }),
    };
    const diData = { loadCrossCut: vi.fn(async () => baseSnap()) };
    const diBundle = { compose: vi.fn() };
    const realtime = { publishDomainAnalysis: vi.fn() };
    const engine = new EconomicPropagationEngineService(
      flags as never,
      diData as never,
      diBundle as never,
      new EconomicShockService(),
      new PropagationRuleEngineService(),
      new TerritoryFragilityService(),
      new PropagationSimulationService(new EconomicShockService(), new PropagationRuleEngineService(), new TerritoryFragilityService(), new CrossPoleImpactService()),
      realtime as unknown as EconomicPropagationRealtimePublishService,
    );
    const pack = await engine.compose("31111111-1111-1111-1111-111111111101", false);
    expect(pack.shocks.length).toBe(0);
    expect(pack.chains.length).toBe(0);
    expect(pack.simulationPreview.triggerType).toBe("propagation_simulation_disabled");
  });
});

describe("Instruction 18.1A — economic propagation hardening", () => {
  it("simulation query rejects invalid severity", () => {
    expect(() => parseEconomicPropagationSimulationQuery({ triggerType: "shipment_delayed", severity: "EXTREME" })).toThrow(
      BadRequestException,
    );
  });

  it("simulation query rejects invalid triggerType", () => {
    expect(() => parseEconomicPropagationSimulationQuery({ triggerType: "unknown_trigger_xyz" })).toThrow(BadRequestException);
  });

  it("simulation query accepts valid trigger and severity", () => {
    const q = parseEconomicPropagationSimulationQuery({ triggerType: "liquidity_collapse", severity: "HIGH" });
    expect(q.triggerType).toBe("liquidity_collapse");
    expect(q.severity).toBe("HIGH");
  });

  it("compose cache avoids second loadCrossCut within TTL", async () => {
    const org = "31111111-1111-1111-1111-111111111101";
    const flags = {
      isEnabled: vi.fn(async (k: string) => {
        if (k === "data_intelligence_enabled") return false;
        return true;
      }),
    };
    const diData = { loadCrossCut: vi.fn(async () => baseSnap()) };
    const diBundle = { compose: vi.fn() };
    const realtime = { publishDomainAnalysis: vi.fn() };
    const engine = new EconomicPropagationEngineService(
      flags as never,
      diData as never,
      diBundle as never,
      new EconomicShockService(),
      new PropagationRuleEngineService(),
      new TerritoryFragilityService(),
      new PropagationSimulationService(
        new EconomicShockService(),
        new PropagationRuleEngineService(),
        new TerritoryFragilityService(),
        new CrossPoleImpactService(),
      ),
      realtime as unknown as EconomicPropagationRealtimePublishService,
    );
    await engine.compose(org, false);
    await engine.compose(org, false);
    expect(diData.loadCrossCut).toHaveBeenCalledTimes(1);
    const pack = await engine.compose(org, false);
    expect(pack.overview.diagnostics?.cacheStrategy).toBe("SHORT_TTL_PROPAGATION_CACHE");
    expect(pack.overview.diagnostics?.cacheKey).toContain(org);
    expect(pack.overview.diagnostics?.ruleCoverage?.every((r) => r.explicitRuleFound)).toBe(true);
  });

  it("shock dedup preserves same type with different territories", () => {
    const snap = baseSnap({
      dataIntelligence: {
        available: true,
        source: "unit",
        bundle: {
          anomalies: {
            anomalies: [
              {
                id: "an1",
                kind: "anomaly",
                severity: 0.7,
                confidence: 0.6,
                impactedPoles: ["data_intelligence"],
                propagationRisk: 0.2,
                territory: "SN_DAKAR",
                probableCause: "c1",
                recommendedActions: [],
              },
              {
                id: "an2",
                kind: "anomaly",
                severity: 0.65,
                confidence: 0.55,
                impactedPoles: ["data_intelligence"],
                propagationRisk: 0.2,
                territory: "SN_THIES",
                probableCause: "c2",
                recommendedActions: [],
              },
            ],
          },
        } as never,
      },
    });
    const shocks = new EconomicShockService().detect(snap);
    const di = shocks.filter((s) => s.type === "data_intelligence_anomaly");
    expect(di.length).toBe(2);
    expect(new Set(di.map((s) => s.deduplicationKey)).size).toBe(2);
  });

  it("every detected shock type has explicit propagation rules", () => {
    const rules = new PropagationRuleEngineService();
    const shocks = new EconomicShockService().detect(baseSnap());
    for (const s of shocks) {
      const m = rules.ruleLookupMeta(s.type);
      expect(m.usedDefaultRule).toBe(false);
      expect(m.explicitRuleFound).toBe(true);
    }
  });

  it("realtime publish does not await slow fanout posts", async () => {
    const fanout = {
      isConfigured: () => true,
      postDomainSignal: vi.fn(() => new Promise(() => {})),
    };
    const pub = new EconomicPropagationRealtimePublishService(fanout as never);
    const bundle = {
      version: "1" as const,
      generatedAt: new Date().toISOString(),
      organizationId: "o",
      overview: {
        version: "1" as const,
        generatedAt: new Date().toISOString(),
        organizationId: "o",
        policy: "ACTIVE" as const,
        headline: "h",
        systemicRiskRollup: 0.5,
        shockCount: 1,
        chainCount: 0,
        territoryFragileTop: 0,
      },
      shocks: [
        {
          id: "s1",
          type: "shipment_delayed",
          sourcePole: "supply_logistics",
          sourceEntityType: "x",
          severity: "HIGH" as const,
          confidence: 0.6,
          affectedPoles: ["supply_logistics"],
          affectedTerritories: [],
          systemicRisk: 0.5,
          sourceSignals: ["a"],
          explanation: "e",
          createdAt: new Date().toISOString(),
        },
      ],
      chains: [],
      territoryFragility: [],
      simulationPreview: {
        simulationId: "sim",
        triggerType: "shipment_delayed",
        estimatedImpacts: [],
        predictedEscalation: "p",
        systemicRiskScore: 0.3,
        affectedPoles: [],
        affectedTerritories: [],
        mitigationRecommendations: [],
      },
    };
    const t0 = Date.now();
    await pub.publishDomainAnalysis("o", bundle as never);
    expect(Date.now() - t0).toBeLessThan(80);
    expect(fanout.postDomainSignal).toHaveBeenCalled();
  });

  it("self-loop impacts are explicitly flagged for unknown shock default path", () => {
    const rules = new PropagationRuleEngineService();
    const snap = baseSnap();
    const shock = {
      id: "x",
      type: "totally_unknown_shock_type_for_test",
      sourcePole: "data_intelligence",
      sourceEntityType: "t",
      severity: "MODERATE" as const,
      confidence: 0.5,
      affectedPoles: ["data_intelligence"],
      affectedTerritories: [],
      systemicRisk: 0.5,
      sourceSignals: ["u"],
      explanation: "e",
      createdAt: snap.generatedAt,
    };
    const impacts = rules.evaluateImpact(shock as never, snap);
    const loop = impacts.find((i) => i.targetPole === shock.sourcePole);
    expect(loop?.selfLoop).toBe(true);
    expect(loop?.impactType).toBe("internal_amplification");
    expect(loop?.explanation.length).toBeGreaterThan(10);
  });

  it("territory without meaningful local evidence stays capped unless CRITICAL shock context", () => {
    const core = baseSnap();
    const snap = {
      ...core,
      finance: { ...core.finance, orders: [] },
      supply: { ...core.supply, shipments: [], orgGeo: new Map() },
      marketingSummary: { ...core.marketingSummary, territorySignals: [] },
      strategicSummary: { ...core.strategicSummary, territorySignals: ["CI_ABIDJAN"] },
    } as EconomicPropagationSnapshot;
    const rows = new TerritoryFragilityService().build(snap);
    for (const r of rows) {
      if (r.localTerritoryEvidence < 0.05) expect(r.fragilityScore).toBeLessThanOrEqual(0.35);
    }
  });
});
