import { describe, expect, it, vi } from "vitest";
import type { EconomicPropagationBundle } from "@venext/shared-contracts";
import { BackofficeAiGatewayService } from "./backoffice/backoffice-ai-gateway.service";
import { BackofficeAuditLogService } from "./backoffice-audit-log/backoffice-audit-log.service";
import { CrisisSignatureService } from "./economic-memory/crisis-signature.service";
import { EconomicMemoryRealtimePublishService } from "./economic-memory/economic-memory-realtime-publish.service";
import { EconomicMemoryStorageService } from "./economic-memory/economic-memory-storage.service";
import { CanonicalFeatureFlagEvaluator } from "./feature-flags/canonical-feature-flag.evaluator";
import { HistoricalPatternService } from "./economic-memory/historical-pattern.service";
import { PropagationHistoryService } from "./economic-memory/propagation-history.service";
import { TemporalEconomicAnalysisService } from "./economic-memory/temporal-economic-analysis.service";

function minimalBundle(over?: Partial<EconomicPropagationBundle>): EconomicPropagationBundle {
  const base: EconomicPropagationBundle = {
    version: "1",
    generatedAt: new Date().toISOString(),
    organizationId: "31111111-1111-1111-1111-111111111101",
    overview: {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId: "31111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      headline: "h",
      systemicRiskRollup: 0.55,
      shockCount: 1,
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
        createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
        },
        impacts: [
          {
            targetPole: "order_adv",
            impactType: "x",
            intensity: 0.4,
            confidence: 0.5,
            estimatedDelayMinutes: 120,
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
        activationExposure: 0.1,
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
  return { ...base, ...over };
}

describe("Instruction 18.2 — economic memory", () => {
  it("crisis signature service derives analytic codes from bundle", () => {
    const crisis = new CrisisSignatureService({} as never);
    const sigs = crisis.deriveSignatures(minimalBundle());
    expect(sigs.some((s) => s.signatureCode === "liquidity_fragility_cluster")).toBe(true);
  });

  it("economic memory AI briefing exposes mock provider metadata", () => {
    const audit = { record: vi.fn() } as unknown as BackofficeAuditLogService;
    const gw = new BackofficeAiGatewayService(audit);
    const b = gw.generateEconomicMemoryBriefing({
      organizationId: "31111111-1111-1111-1111-111111111101",
      shockTypesSample: ["liquidity_collapse"],
      signatureCodes: ["liquidity_fragility_cluster"],
      topPatternTypes: ["liquidity_collapse"],
      trendDirection: "UPWARD_STRESS",
      volatilityLevel: "HIGH",
      eventDepth30d: 12,
      similarEventScore: 0.4,
      historicalConfidence: 0.55,
      dataSources: ["unit"],
    });
    expect(b.providerMode).toBe("MOCK_PROVIDER");
    expect(b.realLLMConnected).toBe(false);
    expect(b.mockContextUsed).toBe(true);
    expect(b.analyticalLimits.length).toBeGreaterThan(0);
  });

  it("storage persist schedules without blocking (void)", () => {
    const prisma = {
      economicEventMemory: {
        create: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      economicPropagationMemory: { create: vi.fn().mockResolvedValue({}) },
      economicCrisisSignature: { create: vi.fn().mockResolvedValue({}) },
      economicTemporalSnapshot: {
        create: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    };
    const flags = {
      isEnabled: vi.fn(async (k: string) => {
        if (k === "economic_memory_enabled") return true;
        if (k === "crisis_signature_enabled") return true;
        if (k === "temporal_analysis_enabled") return true;
        return false;
      }),
    } as unknown as CanonicalFeatureFlagEvaluator;
    const crisis = new CrisisSignatureService(prisma as never);
    const temporal = new TemporalEconomicAnalysisService(prisma as never);
    const fanout = { isConfigured: () => false, postDomainSignal: vi.fn() };
    const realtime = new EconomicMemoryRealtimePublishService(fanout as never);
    const storage = new EconomicMemoryStorageService(prisma as never, flags, crisis, temporal, realtime);
    storage.persistPropagationSnapshot(minimalBundle());
    expect(prisma.economicEventMemory.create).not.toHaveBeenCalled();
  });

  it("historical pattern service maps groupBy rows", async () => {
    const prisma = {
      economicEventMemory: {
        groupBy: vi.fn().mockResolvedValue([
          { eventType: "propagation_shock.shipment_delayed", _count: { _all: 4 } },
          { eventType: "propagation_shock.liquidity_collapse", _count: { _all: 2 } },
        ]),
      },
    };
    const svc = new HistoricalPatternService(prisma as never);
    const rows = await svc.shockPatterns("31111111-1111-1111-1111-111111111101");
    expect(rows[0]!.shockType).toBe("shipment_delayed");
    expect(rows[0]!.count30d).toBe(4);
  });

  it("propagation history similarity is bounded 0–1", async () => {
    const prisma = {
      economicEventMemory: {
        findMany: vi.fn().mockResolvedValue([{ eventType: "propagation_shock.liquidity_collapse" }]),
      },
    };
    const hist = new PropagationHistoryService(prisma as never);
    const sim = await hist.propagationSimilarity("31111111-1111-1111-1111-111111111101", minimalBundle());
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});
