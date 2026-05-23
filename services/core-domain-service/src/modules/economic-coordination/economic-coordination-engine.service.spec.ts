import { describe, expect, it, vi } from "vitest";

import type {
  DataIntelligenceBundleResponse,
  EconomicCoordinationBundle,
  EconomicMemoryBundle,
  EconomicPropagationBundle,
  EconomicScenariosBundle,
} from "@venext/shared-contracts";

import { EconomicCoordinationEngineService } from "./economic-coordination-engine.service";

const org = "31111111-1111-1111-1111-111111111101";

function minimalSimulation(): EconomicPropagationBundle["simulationPreview"] {
  return {
    simulationId: "sim",
    triggerType: "t",
    estimatedImpacts: [],
    predictedEscalation: "none",
    systemicRiskScore: 0.1,
    affectedPoles: [],
    affectedTerritories: [],
    mitigationRecommendations: [],
  };
}

function minimalPropagation(upstream?: DataIntelligenceBundleResponse): EconomicPropagationBundle {
  return {
    version: "1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    organizationId: org,
    overview: {
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: org,
      policy: "ACTIVE",
      headline: "h",
      systemicRiskRollup: 0.1,
      shockCount: 2,
      chainCount: 0,
      territoryFragileTop: 0,
    },
    shocks: [],
    chains: [],
    territoryFragility: [],
    simulationPreview: minimalSimulation(),
    ...(upstream ? { upstreamDataIntelligenceBundle: upstream } : {}),
  };
}

function minimalDi(): DataIntelligenceBundleResponse {
  return {
    overview: { economicPropagationScore: 0.35 },
    correlations: { rows: [] },
  } as DataIntelligenceBundleResponse;
}

function minimalScenarios(): EconomicScenariosBundle {
  return {
    overview: { maxProjectedRisk: 0.12, meanStabilizationProbability: 0.55 },
    scenarios: [],
  } as EconomicScenariosBundle;
}

function minimalEconomicMemory(): EconomicMemoryBundle {
  return { crisisSignatures: [] } as EconomicMemoryBundle;
}

describe("EconomicCoordinationEngineService — Data Intelligence reuse (18.4A)", () => {
  it("does not call di.compose when propagation echoes upstream Data Intelligence", async () => {
    const upstream = minimalDi();
    const propagation = { compose: vi.fn().mockResolvedValue(minimalPropagation(upstream)) };
    const scenarios = {
      composeFreshFromPropagation: vi.fn().mockResolvedValue(minimalScenarios()),
    };
    const memory = { composeBundle: vi.fn().mockResolvedValue(minimalEconomicMemory()) };
    const di = { compose: vi.fn() };
    const flags = {
      isEnabled: vi.fn().mockImplementation((_k: string) => Promise.resolve(true)),
    };
    const posture = {
      derive: vi.fn().mockReturnValue({
        posture: "STABLE",
        confidence: 0.5,
        systemicRisk: 0.1,
        coordinationStress: 0.1,
        explanation: "x",
        sourceSignals: [],
        affectedPoles: [],
        affectedTerritories: [],
      }),
    };
    const conflicts = { detect: vi.fn().mockReturnValue([]) };
    const priorities = { rank: vi.fn().mockReturnValue([]) };
    const orchestrations = { build: vi.fn().mockReturnValue([]) };
    const escalation = {
      assess: vi.fn().mockReturnValue({
        escalationLevel: "LOW" as const,
        escalationScore: 0,
        escalationDrivers: [],
        affectedPoles: [],
        coordinationRecommendation: "r",
        executiveAttentionRequired: false,
        diagnostics: [],
      }),
    };
    const coordinationMemory = {
      composeBlock: vi.fn().mockResolvedValue({
        recurringPatterns: [],
        recurringConflicts: [],
        recurringStabilizationPatterns: [],
        memoryConfidence: 0,
        historicalSimilarity: 0,
        signals: [],
        diagnostics: [],
      }),
    };
    const realtime = { publishCoordinationPulse: vi.fn() };

    const engine = new EconomicCoordinationEngineService(
      flags as never,
      propagation as never,
      scenarios as never,
      memory as never,
      di as never,
      posture as never,
      conflicts as never,
      priorities as never,
      orchestrations as never,
      escalation as never,
      coordinationMemory as never,
      realtime as never,
    );

    const { bundle } = await engine.getBundleWithCacheMeta(org, "summary");
    expect((bundle as EconomicCoordinationBundle).diagnostics.dataIntelligenceReuse).toBe("FROM_PROPAGATION");
    expect((bundle as EconomicCoordinationBundle).diagnostics.dataIntelligenceComposeCount).toBe(0);
    expect(di.compose).not.toHaveBeenCalled();
  });

  it("calls di.compose once when propagation has no upstream Data Intelligence", async () => {
    const propagation = { compose: vi.fn().mockResolvedValue(minimalPropagation()) };
    const scenarios = {
      composeFreshFromPropagation: vi.fn().mockResolvedValue(minimalScenarios()),
    };
    const memory = { composeBundle: vi.fn().mockResolvedValue(minimalEconomicMemory()) };
    const di = { compose: vi.fn().mockResolvedValue(minimalDi()) };
    const flags = {
      isEnabled: vi.fn().mockImplementation((_k: string) => Promise.resolve(true)),
    };
    const posture = {
      derive: vi.fn().mockReturnValue({
        posture: "STABLE",
        confidence: 0.5,
        systemicRisk: 0.1,
        coordinationStress: 0.1,
        explanation: "x",
        sourceSignals: [],
        affectedPoles: [],
        affectedTerritories: [],
      }),
    };
    const conflicts = { detect: vi.fn().mockReturnValue([]) };
    const priorities = { rank: vi.fn().mockReturnValue([]) };
    const orchestrations = { build: vi.fn().mockReturnValue([]) };
    const escalation = {
      assess: vi.fn().mockReturnValue({
        escalationLevel: "LOW" as const,
        escalationScore: 0,
        escalationDrivers: [],
        affectedPoles: [],
        coordinationRecommendation: "r",
        executiveAttentionRequired: false,
        diagnostics: [],
      }),
    };
    const coordinationMemory = {
      composeBlock: vi.fn().mockResolvedValue({
        recurringPatterns: [],
        recurringConflicts: [],
        recurringStabilizationPatterns: [],
        memoryConfidence: 0,
        historicalSimilarity: 0,
        signals: [],
        diagnostics: [],
      }),
    };
    const realtime = { publishCoordinationPulse: vi.fn() };

    const engine = new EconomicCoordinationEngineService(
      flags as never,
      propagation as never,
      scenarios as never,
      memory as never,
      di as never,
      posture as never,
      conflicts as never,
      priorities as never,
      orchestrations as never,
      escalation as never,
      coordinationMemory as never,
      realtime as never,
    );

    const { bundle } = await engine.getBundleWithCacheMeta(org, "summary");
    expect((bundle as EconomicCoordinationBundle).diagnostics.dataIntelligenceReuse).toBe("DIRECT_COMPOSE");
    expect((bundle as EconomicCoordinationBundle).diagnostics.dataIntelligenceComposeCount).toBe(1);
    expect(di.compose).toHaveBeenCalledTimes(1);
  });

  it("summary projection omits sourceBundles; full projection embeds them", async () => {
    const upstream = minimalDi();
    const propagation = { compose: vi.fn().mockResolvedValue(minimalPropagation(upstream)) };
    const scenarios = {
      composeFreshFromPropagation: vi.fn().mockResolvedValue(minimalScenarios()),
    };
    const memory = { composeBundle: vi.fn().mockResolvedValue(minimalEconomicMemory()) };
    const di = { compose: vi.fn() };
    const flags = {
      isEnabled: vi.fn().mockImplementation((_k: string) => Promise.resolve(true)),
    };
    const posture = {
      derive: vi.fn().mockReturnValue({
        posture: "STABLE",
        confidence: 0.5,
        systemicRisk: 0.1,
        coordinationStress: 0.1,
        explanation: "x",
        sourceSignals: [],
        affectedPoles: [],
        affectedTerritories: [],
      }),
    };
    const conflicts = { detect: vi.fn().mockReturnValue([]) };
    const priorities = { rank: vi.fn().mockReturnValue([]) };
    const orchestrations = { build: vi.fn().mockReturnValue([]) };
    const escalation = {
      assess: vi.fn().mockReturnValue({
        escalationLevel: "LOW" as const,
        escalationScore: 0,
        escalationDrivers: [],
        affectedPoles: [],
        coordinationRecommendation: "r",
        executiveAttentionRequired: false,
        diagnostics: [],
      }),
    };
    const coordinationMemory = {
      composeBlock: vi.fn().mockResolvedValue({
        recurringPatterns: [],
        recurringConflicts: [],
        recurringStabilizationPatterns: [],
        memoryConfidence: 0,
        historicalSimilarity: 0,
        signals: [],
        diagnostics: [],
      }),
    };
    const realtime = { publishCoordinationPulse: vi.fn() };

    const engine = new EconomicCoordinationEngineService(
      flags as never,
      propagation as never,
      scenarios as never,
      memory as never,
      di as never,
      posture as never,
      conflicts as never,
      priorities as never,
      orchestrations as never,
      escalation as never,
      coordinationMemory as never,
      realtime as never,
    );

    const summary = await engine.getBundleWithCacheMeta(org, "summary");
    expect(summary.bundle.sourceBundles).toBeUndefined();
    expect(summary.bundle.diagnostics.sourceBundlesEmbedded).toBe(false);
    expect(summary.bundle.diagnostics.payloadProjection).toBe("summary");

    const full = await engine.getBundleWithCacheMeta(org, "full");
    expect(full.bundle.sourceBundles).toBeDefined();
    expect(full.bundle.diagnostics.sourceBundlesEmbedded).toBe(true);
    expect(full.bundle.diagnostics.payloadProjection).toBe("full");
  });
});
