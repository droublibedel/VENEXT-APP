import { describe, expect, it, vi } from "vitest";
import type { EconomicPropagationBundle } from "@venext/shared-contracts";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { BackofficeAuditLogService } from "./backoffice-audit-log/backoffice-audit-log.service";
import { ScenarioComparisonService } from "./economic-scenarios/scenario-comparison.service";
import { ScenarioGenerationService } from "./economic-scenarios/scenario-generation.service";
import { ScenarioImpactService } from "./economic-scenarios/scenario-impact.service";
import { ScenarioMemoryLinkService } from "./economic-scenarios/scenario-memory-link.service";
import { ScenarioRiskService } from "./economic-scenarios/scenario-risk.service";
import { ScenarioStabilizationService } from "./economic-scenarios/scenario-stabilization.service";
import { ScenarioTrajectoryService } from "./economic-scenarios/scenario-trajectory.service";
import { EconomicScenariosRealtimePublishService } from "./economic-scenarios/economic-scenarios-realtime-publish.service";

function minimalPropagation(): EconomicPropagationBundle {
  const ts = "2026-05-12T12:00:00.000Z";
  return {
    version: "1",
    generatedAt: ts,
    organizationId: "31111111-1111-1111-1111-111111111101",
    overview: {
      version: "1",
      generatedAt: ts,
      organizationId: "31111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      headline: "test",
      systemicRiskRollup: 0.44,
      shockCount: 2,
      chainCount: 1,
      territoryFragileTop: 1,
    },
    shocks: [
      {
        id: "s1",
        type: "liquidity_collapse",
        sourcePole: "finance_collections",
        sourceEntityType: "t",
        severity: "HIGH",
        confidence: 0.6,
        affectedPoles: ["finance_collections"],
        affectedTerritories: ["SN_DAKAR"],
        systemicRisk: 0.7,
        sourceSignals: ["x"],
        explanation: "e",
        createdAt: ts,
      },
    ],
    chains: [
      {
        chainId: "c1",
        shock: {
          id: "s1",
          type: "liquidity_collapse",
          sourcePole: "finance_collections",
          sourceEntityType: "t",
          severity: "HIGH",
          confidence: 0.6,
          affectedPoles: ["finance_collections"],
          affectedTerritories: ["SN_DAKAR"],
          systemicRisk: 0.7,
          sourceSignals: ["x"],
          explanation: "e",
          createdAt: ts,
        },
        impacts: [
          {
            targetPole: "order_adv",
            impactType: "delay",
            intensity: 0.4,
            confidence: 0.5,
            estimatedDelayMinutes: 60,
            affectedTerritories: [],
            explanation: "i",
          },
        ],
        systemicRiskScore: 0.5,
        propagationDepth: 2,
        recommendedInterventions: [],
      },
    ],
    territoryFragility: [
      {
        territory: "SN_DAKAR",
        globalSystemicPressure: 0.4,
        localTerritoryEvidence: 0.5,
        localEvidenceSignals: ["a"],
        fragilityScore: 0.5,
        liquidityExposure: 0.3,
        logisticsExposure: 0.2,
        relationshipExposure: 0.2,
        paymentExposure: 0.3,
        activationExposure: 0.2,
        resilienceScore: 0.5,
        explanation: "t",
      },
    ],
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
}

describe("Instruction 18.3 — economic scenarios", () => {
  it("generation is deterministic for same seed inputs", () => {
    const gen = new ScenarioGenerationService();
    const mem = { eventDepth30d: 4, signatureHints: ["liquidity_fragility_cluster"], patternTypes: ["liquidity_collapse"] };
    const a = gen.generate({ organizationId: "31111111-1111-1111-1111-111111111101", bundle: minimalPropagation(), memory: mem });
    const b = gen.generate({ organizationId: "31111111-1111-1111-1111-111111111101", bundle: minimalPropagation(), memory: mem });
    expect(a.map((x) => x.scenarioCode).join(",")).toBe(b.map((x) => x.scenarioCode).join(","));
    expect(a.length).toBe(9);
  });

  it("trajectory service emits T0–T3 with provenance", () => {
    const gen = new ScenarioGenerationService();
    const traj = new ScenarioTrajectoryService();
    const core = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: minimalPropagation(),
      memory: { eventDepth30d: 0, signatureHints: [], patternTypes: [] },
    })[0]!;
    const pack = traj.project(minimalPropagation(), core);
    expect(pack.steps.map((s) => s.label).join(",")).toBe("T0,T1,T2,T3");
    expect(pack.provenance.some((p) => p.includes("propagation.systemicRiskRollup"))).toBe(true);
  });

  it("comparison produces bounded similarity", () => {
    const cmp = new ScenarioComparisonService();
    const gen = new ScenarioGenerationService();
    const traj = new ScenarioTrajectoryService();
    const impact = new ScenarioImpactService();
    const cores = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: minimalPropagation(),
      memory: { eventDepth30d: 0, signatureHints: [], patternTypes: [] },
    });
    const projections = cores.slice(0, 2).map((core) => {
      const t = traj.project(minimalPropagation(), core);
      return {
        scenarioCode: core.scenarioCode,
        scenarioType: core.scenarioType,
        triggerType: core.triggerType,
        severity: core.severity,
        sourcePole: core.sourcePole,
        confidence: core.confidence,
        affectedPoles: core.affectedPoles,
        affectedTerritories: core.affectedTerritories,
        projectedRisk: core.projectedRisk,
        stabilizationProbability: core.stabilizationProbability,
        estimatedPropagationDepth: core.estimatedPropagationDepth,
        trajectory: t,
        impacts: impact.buildImpacts(minimalPropagation(), core),
      };
    });
    const row = cmp.comparePair(projections[0]!, projections[1]!);
    expect(row.similarityScore).toBeGreaterThanOrEqual(0);
    expect(row.similarityScore).toBeLessThanOrEqual(1);
  });

  it("memory link skips prisma findMany when compose prefetched recentMemoryEventTypes", async () => {
    const findMany = vi.fn();
    const prisma = { economicEventMemory: { findMany } };
    const svc = new ScenarioMemoryLinkService(prisma as never);
    const gen = new ScenarioGenerationService();
    const core = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: minimalPropagation(),
      memory: { eventDepth30d: 10, signatureHints: [], patternTypes: ["liquidity_collapse"] },
    })[0]!;
    const link = await svc.link("31111111-1111-1111-1111-111111111101", core, minimalPropagation(), {
      eventDepth30d: 10,
      signatureHints: [],
      patternTypes: ["liquidity_collapse"],
      recentMemoryEventTypes: ["propagation_shock.liquidity_collapse"],
    });
    expect(findMany).not.toHaveBeenCalled();
    expect(link.historicalSimilarity).toBeGreaterThanOrEqual(0);
    expect(link.historicalSimilarity).toBeLessThanOrEqual(1);
  });

  it("memory link queries prisma once when recentMemoryEventTypes omitted", async () => {
    const findMany = vi.fn().mockResolvedValue([{ eventType: "propagation_shock.liquidity_collapse" }]);
    const prisma = { economicEventMemory: { findMany } };
    const svc = new ScenarioMemoryLinkService(prisma as never);
    const gen = new ScenarioGenerationService();
    const core = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: minimalPropagation(),
      memory: { eventDepth30d: 10, signatureHints: [], patternTypes: ["liquidity_collapse"] },
    })[0]!;
    await svc.link("31111111-1111-1111-1111-111111111101", core, minimalPropagation(), {
      eventDepth30d: 10,
      signatureHints: [],
      patternTypes: ["liquidity_collapse"],
    });
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("impact service merges impacts across all propagation chains", () => {
    const impact = new ScenarioImpactService();
    const gen = new ScenarioGenerationService();
    const b = minimalPropagation();
    const shockTemplate = b.chains[0]!.shock;
    b.chains = [
      {
        ...b.chains[0]!,
        chainId: "c1",
        impacts: b.chains[0]!.impacts,
      },
      {
        chainId: "c2",
        shock: { ...shockTemplate, id: "s2", type: "logistics_blockage" },
        impacts: [
          {
            targetPole: "finance_collections",
            impactType: "stress",
            intensity: 0.5,
            confidence: 0.55,
            estimatedDelayMinutes: 0,
            affectedTerritories: [],
            explanation: "x",
          },
        ],
        systemicRiskScore: 0.4,
        propagationDepth: 1,
        recommendedInterventions: [],
      },
    ];
    const core = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: b,
      memory: { eventDepth30d: 0, signatureHints: [], patternTypes: [] },
    })[0]!;
    const rows = impact.buildImpacts(b, core);
    const chainIds = new Set(rows.map((r) => r.chainId).filter(Boolean));
    expect(chainIds.has("c1")).toBe(true);
    expect(chainIds.has("c2")).toBe(true);
    expect(rows[0]!.sourceChainCount).toBe(2);
    expect(rows.every((r) => r.observational === true && r.source !== "SYNTHETIC_FALLBACK")).toBe(true);
  });

  it("synthetic fallback impacts are explicitly non-observational", () => {
    const impact = new ScenarioImpactService();
    const gen = new ScenarioGenerationService();
    const b = minimalPropagation();
    b.chains = [];
    b.shocks = [];
    const core = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: b,
      memory: { eventDepth30d: 0, signatureHints: [], patternTypes: [] },
    })[0]!;
    const rows = impact.buildImpacts(b, core);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.source === "SYNTHETIC_FALLBACK" && r.observational === false)).toBe(true);
    expect(rows[0]!.explanation?.toLowerCase()).toContain("synthetic fallback");
  });

  it("risk service exposes explanation and confidence", () => {
    const gen = new ScenarioGenerationService();
    const traj = new ScenarioTrajectoryService();
    const risk = new ScenarioRiskService();
    const core = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: minimalPropagation(),
      memory: { eventDepth30d: 0, signatureHints: [], patternTypes: [] },
    })[0]!;
    const t = traj.project(minimalPropagation(), core);
    const r = risk.assess(core, minimalPropagation(), t);
    expect(r.explanation.length).toBeGreaterThan(10);
    expect(r.confidence).toBeGreaterThan(0.3);
  });

  it("stabilization directions are advisory only", () => {
    const stab = new ScenarioStabilizationService();
    const gen = new ScenarioGenerationService();
    const core = gen.generate({
      organizationId: "31111111-1111-1111-1111-111111111101",
      bundle: minimalPropagation(),
      memory: { eventDepth30d: 0, signatureHints: [], patternTypes: [] },
    })[0]!;
    const p = stab.propose(core, minimalPropagation());
    expect(p.note.toLowerCase()).toContain("no automatic");
    expect(p.stabilizationDirections.length).toBeGreaterThan(0);
  });

  it("realtime publish is no-op when fanout not configured", () => {
    const fanout = { isConfigured: () => false, postDomainSignal: vi.fn() };
    const rt = new EconomicScenariosRealtimePublishService(fanout as never);
    expect(() =>
      rt.publishScenariosPulse("31111111-1111-1111-1111-111111111101", {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        headline: "h",
        disclaimer: "d",
        overview: {
          version: "1",
          generatedAt: new Date().toISOString(),
          organizationId: "31111111-1111-1111-1111-111111111101",
          policy: "ACTIVE",
          headline: "o",
          scenarioCount: 1,
          maxProjectedRisk: 0.5,
          meanStabilizationProbability: 0.5,
          dominantScenarioTypes: ["x"],
        },
        scenarios: [],
        comparisons: [],
      }),
    ).not.toThrow();
    expect(fanout.postDomainSignal).not.toHaveBeenCalled();
  });

  it("economic scenario AI briefing exposes mock metadata", () => {
    const audit = { record: vi.fn() } as unknown as BackofficeAuditLogService;
    const gw = new BackofficeAiGatewayService(audit);
    const b = gw.generateEconomicScenarioBriefing({
      organizationId: "31111111-1111-1111-1111-111111111101",
      scenarioTypesSample: ["supply_disruption"],
      maxProjectedRisk: 0.55,
      comparisonCount: 3,
      memorySparse: true,
      dataSources: ["unit"],
    });
    expect(b.providerMode).toBe("MOCK_PROVIDER");
    expect(b.realLLMConnected).toBe(false);
    expect(b.mockContextUsed).toBe(true);
    expect(b.limits.length).toBeGreaterThan(0);
  });
});
