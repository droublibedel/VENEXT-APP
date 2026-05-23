import { describe, expect, it, vi } from "vitest";

import { EconomicCommandBundleSchema } from "@venext/shared-contracts";

import { IndustrialSituationRoomEngineService } from "./industrial-situation-room/industrial-situation-room-engine.service";

const ORG = "31111111-1111-1111-1111-111111111101";

function stubEconomicCommandBundle() {
  return EconomicCommandBundleSchema.parse({
    version: "1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    organizationId: ORG,
    policy: "ACTIVE",
    disclaimer: "Advisory economic command projection.",
    overview: {
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: ORG,
      policy: "ACTIVE",
      headline: "Command stress digest",
      executivePosture: "STRESSED_COORDINATION",
      dominantStress: "logistics",
      tensionCount: 1,
      pressureZoneCount: 1,
      riskCount: 0,
      arbitrationCount: 0,
      signalDigest: "digest-for-situation-room-test",
    },
    pressureZones: [
      {
        zoneId: "pz-1",
        zoneType: "logistics_lane_pressure",
        label: "L1",
        pressureScore: 0.55,
        systemicWeight: 0.5,
        affectedPoles: ["supply_logistics", "finance_collections"],
        affectedTerritories: ["T1"],
        sourceSignals: ["propagation.chain.seed", "coordination.conflict.edge"],
        explanation: "Synthetic pressure zone for ISR derivation test.",
        heuristicOnly: true,
      },
    ],
    decisionRisks: [],
    arbitrations: [],
    systemStress: {
      globalStress: 0.55,
      logisticsStress: 0.4,
      financialStress: 0.35,
      relationshipStress: 0.3,
      coordinationStress: 0.52,
      silentStress: 0.35,
      scenarioStress: 0.48,
      stressMode: "PROXY_HEURISTIC",
      explanation: "Proxy stress rollup.",
      sourceSignals: ["economic_command.systemStress"],
    },
    silentTensions: [
      {
        tensionId: "st-1",
        tensionType: "silent_supply",
        intensity: 0.4,
        confidence: 0.5,
        affectedPoles: ["supply_logistics"],
        affectedTerritories: [],
        sourceSignals: [],
        explanation: "Silent tension one.",
        heuristicOnly: true,
      },
      {
        tensionId: "st-2",
        tensionType: "silent_finance",
        intensity: 0.42,
        confidence: 0.5,
        affectedPoles: ["finance_collections"],
        affectedTerritories: [],
        sourceSignals: [],
        explanation: "Silent tension two.",
        heuristicOnly: true,
      },
    ],
    narrative: {
      narrativeMode: "HEURISTIC_EXECUTIVE_SUMMARY",
      lines: ["Line one"],
      dominantPressure: "logistics",
      executiveWarning: "none",
      recommendedFocus: "coordination",
      limitations: "symbolic only",
    },
    executiveSignals: [],
    diagnostics: {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      sourceMode: "LIVE_ECONOMIC_COMMAND_COMPOSE",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      cacheStrategy: "SHORT_TTL_COMMAND_CACHE",
      composeCount: 6,
      composePlan: {
        propagationCompose: 1,
        coordinationCompose: 1,
        scenariosCompose: 1,
        memoryCompose: 1,
        dataIntelligenceCompose: 1,
        commandCompose: 1,
      },
      composeCountMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: "Test disclosure.",
      reusedBundles: [],
      sourceBundlesEmbedded: false,
    },
  });
}

describe("Instruction 18.6 — industrial situation room", () => {
  it("reuses a single economic-command compose per TTL (no second upstream call)", async () => {
    const cmd = stubEconomicCommandBundle();
    const getBundleWithCacheMeta = vi.fn().mockResolvedValue({ bundle: cmd, composeCacheHit: false });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key === "industrial_situation_room_realtime_enabled") return false;
        if (
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const realtime = { publishSituationPulse: vi.fn() };
    const engine = new IndustrialSituationRoomEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      realtime as never,
    );
    const a = await engine.getBundleWithCacheMeta(ORG, "summary");
    const b = await engine.getBundleWithCacheMeta(ORG, "summary");
    expect(getBundleWithCacheMeta).toHaveBeenCalledTimes(1);
    expect(a.composeCacheHit).toBe(false);
    expect(b.composeCacheHit).toBe(true);
    expect(b.bundle.diagnostics.composePlan.situationRoomSynthesis).toBe(1);
    expect(b.bundle.diagnostics.composePlan.propagationCompose).toBe(1);
  });

  it("materializes missions and cells as advisoryOnly + symbolicExecution", async () => {
    const cmd = stubEconomicCommandBundle();
    const getBundleWithCacheMeta = vi.fn().mockResolvedValue({ bundle: cmd, composeCacheHit: false });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key === "industrial_situation_room_realtime_enabled") return false;
        if (
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const engine = new IndustrialSituationRoomEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      { publishSituationPulse: vi.fn() } as never,
    );
    const { bundle } = await engine.getBundleWithCacheMeta(ORG, "summary");
    expect(bundle.situationCells.length).toBeGreaterThan(0);
    expect(bundle.operationalMissions.length).toBeGreaterThan(0);
    for (const m of bundle.operationalMissions) {
      expect(m.advisoryOnly).toBe(true);
      expect(m.symbolicExecution).toBe(true);
    }
    for (const c of bundle.situationCells) {
      expect(c.advisoryOnly).toBe(true);
      expect(c.symbolicExecution).toBe(true);
    }
    for (const d of bundle.criticalDependencies) {
      expect(d.advisoryOnly).toBe(true);
      expect(d.symbolicExecution).toBe(true);
    }
    for (const e of bundle.executiveAttention) {
      expect(e.heuristicOnly).toBe(true);
      expect(e.advisoryOnly).toBe(true);
      expect(e.symbolicExecution).toBe(true);
    }
  });

  it("disclaimer and briefings avoid conversational / autonomous product wording", async () => {
    const cmd = stubEconomicCommandBundle();
    const getBundleWithCacheMeta = vi.fn().mockResolvedValue({ bundle: cmd, composeCacheHit: false });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key === "industrial_situation_room_realtime_enabled") return false;
        if (
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const engine = new IndustrialSituationRoomEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      { publishSituationPulse: vi.fn() } as never,
    );
    const { bundle } = await engine.getBundleWithCacheMeta(ORG, "summary");
    const blob = [
      bundle.disclaimer,
      ...bundle.briefings.executiveLines,
      ...bundle.briefings.operationalLines,
      ...bundle.briefings.stabilizationLines,
    ]
      .join(" ")
      .toLowerCase();
    expect(blob).not.toContain("copilot");
    expect(blob).not.toContain("chatbot");
    expect(blob).not.toContain("ai assistant");
    expect(blob).not.toContain("we recommend");
  });
});
