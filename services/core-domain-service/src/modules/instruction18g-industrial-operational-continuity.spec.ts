import { describe, expect, it, vi } from "vitest";

import { IndustrialSituationRoomBundleSchema } from "@venext/shared-contracts";

import { IndustrialOperationalContinuityEngineService } from "./industrial-operational-continuity/industrial-operational-continuity-engine.service";

const ORG = "31111111-1111-1111-1111-111111111101";

function stubIsrBundle() {
  return IndustrialSituationRoomBundleSchema.parse({
    version: "1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    organizationId: ORG,
    policy: "ACTIVE",
    disclaimer: "ISR advisory.",
    snapshot: {
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: ORG,
      snapshotSource: "LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE",
      economicCommandDigest: {
        bundleGeneratedAt: "2026-01-01T00:00:00.000Z",
        headline: "Command digest",
        pressureZoneCount: 2,
        riskCount: 0,
        arbitrationCount: 0,
        globalStress: 0.5,
        executivePosture: "STRESSED",
        dominantStress: "logistics",
      },
    },
    situationCells: [
      {
        cellId: "c1",
        cellType: "supply_recovery_cell",
        advisoryOnly: true,
        symbolicExecution: true,
        confidence: 0.5,
        urgency: 0.55,
        stabilizationPotential: 0.45,
        coordinationLoad: 0.4,
        affectedPoles: ["supply_logistics"],
        sourceSignals: ["economic_command.pressureZones.z1"],
        explanation: "Cell test.",
      },
    ],
    operationalMissions: [
      {
        missionCode: "m1",
        missionType: "stabilization",
        advisoryOnly: true,
        symbolicExecution: true,
        operationalWeight: 0.5,
        expectedImpact: 0.4,
        executionComplexity: 0.45,
        stabilizationPriority: 0.5,
        affectedPoles: ["supply_logistics"],
        sourceSignals: ["stress"],
        explanation: "Mission test.",
      },
    ],
    criticalDependencies: [
      {
        dependencyId: "d1",
        kind: "upstream",
        advisoryOnly: true,
        symbolicExecution: true,
        fragility: 0.42,
        systemicExposure: 0.4,
        involvedPoles: ["supply_logistics"],
        sourceSignals: ["propagation.chain"],
        explanation: "Dep test.",
      },
    ],
    executiveAttention: [],
    briefings: {
      executiveLines: ["a"],
      operationalLines: ["b"],
      stabilizationLines: ["c"],
    },
    diagnostics: {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      deterministicReadout: true,
      sourceMode: "LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      cacheStrategy: "SHORT_TTL_SITUATION_ROOM_CACHE",
      composeCount: 7,
      composePlan: {
        propagationCompose: 1,
        coordinationCompose: 1,
        scenariosCompose: 1,
        memoryCompose: 1,
        dataIntelligenceCompose: 1,
        commandCompose: 1,
        situationRoomSynthesis: 1,
      },
      composeCountMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: "c",
      reusedBundles: [],
      sourceBundlesEmbedded: false,
      degradedMode: false,
      snapshotSource: "LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE",
      upstreamPropagationColdStarts: 1,
    },
  });
}

describe("Instruction 18.7 — industrial operational continuity", () => {
  it("invokes situation room materialization once per TTL (no second upstream ISR call)", async () => {
    const isr = stubIsrBundle();
    const getBundleWithCacheMeta = vi.fn().mockResolvedValue({ bundle: isr, composeCacheHit: false });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key === "industrial_operational_continuity_realtime_enabled") return false;
        if (key === "industrial_situation_room_realtime_enabled") return false;
        if (
          key === "industrial_operational_continuity_enabled" ||
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const engine = new IndustrialOperationalContinuityEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      { publishContinuityPulse: vi.fn() } as never,
    );
    const a = await engine.getBundleWithCacheMeta(ORG, "summary");
    const b = await engine.getBundleWithCacheMeta(ORG, "summary");
    expect(getBundleWithCacheMeta).toHaveBeenCalledTimes(1);
    expect(a.composeCacheHit).toBe(false);
    expect(b.composeCacheHit).toBe(true);
    expect(b.bundle.diagnostics.continuityComposePlan.continuitySynthesis).toBe(1);
    expect(b.bundle.diagnostics.continuityComposePlan.situationRoomMaterialization).toBe(1);
    expect(b.bundle.diagnostics.productRole).toBe("CONTINUITY_LENS_ABOVE_SITUATION_ROOM");
    expect(b.bundle.diagnostics.inFlightReuse).toBe(false);
  });

  it("dedupes concurrent cold composes — single ISR call; one waiter has inFlightReuse true", async () => {
    const isr = stubIsrBundle();
    let active = 0;
    let peak = 0;
    const getBundleWithCacheMeta = vi.fn(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 25));
      active -= 1;
      return { bundle: isr, composeCacheHit: false };
    });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key === "industrial_operational_continuity_realtime_enabled") return false;
        if (key === "industrial_situation_room_realtime_enabled") return false;
        if (
          key === "industrial_operational_continuity_enabled" ||
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const engine = new IndustrialOperationalContinuityEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      { publishContinuityPulse: vi.fn() } as never,
    );
    const [a, b] = await Promise.all([
      engine.getBundleWithCacheMeta(ORG, "summary"),
      engine.getBundleWithCacheMeta(ORG, "summary"),
    ]);
    expect(getBundleWithCacheMeta).toHaveBeenCalledTimes(1);
    expect(peak).toBe(1);
    expect([a.bundle.diagnostics.inFlightReuse, b.bundle.diagnostics.inFlightReuse].sort()).toEqual([false, true]);
  });

  it("clears in-flight when ISR compose fails so a later call can retry", async () => {
    const isr = stubIsrBundle();
    let n = 0;
    const getBundleWithCacheMeta = vi.fn(async () => {
      n += 1;
      if (n === 1) throw new Error("isr_down");
      return { bundle: isr, composeCacheHit: false };
    });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key === "industrial_operational_continuity_realtime_enabled") return false;
        if (key === "industrial_situation_room_realtime_enabled") return false;
        if (
          key === "industrial_operational_continuity_enabled" ||
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const engine = new IndustrialOperationalContinuityEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      { publishContinuityPulse: vi.fn() } as never,
    );
    await expect(engine.getBundleWithCacheMeta(ORG, "summary")).rejects.toThrow("isr_down");
    const ok = await engine.getBundleWithCacheMeta(ORG, "summary");
    expect(getBundleWithCacheMeta).toHaveBeenCalledTimes(2);
    expect(ok.bundle.diagnostics.productRole).toBe("CONTINUITY_LENS_ABOVE_SITUATION_ROOM");
  });

  it("derives corridors from situation-room dependencies deterministically", async () => {
    const isr = stubIsrBundle();
    const getBundleWithCacheMeta = vi.fn().mockResolvedValue({ bundle: isr, composeCacheHit: false });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key.endsWith("_realtime_enabled")) return false;
        if (
          key === "industrial_operational_continuity_enabled" ||
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const engine = new IndustrialOperationalContinuityEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      { publishContinuityPulse: vi.fn() } as never,
    );
    const { bundle } = await engine.getBundleWithCacheMeta(ORG, "summary");
    expect(bundle.continuityCorridors.length).toBeGreaterThan(0);
    expect(bundle.continuityCorridors[0]!.kind).toBe("fragile_operational_corridor");
    expect(bundle.cadenceSignals.length).toBeGreaterThan(0);
    expect(bundle.diagnostics.productRole).toBe("CONTINUITY_LENS_ABOVE_SITUATION_ROOM");
    for (const c of bundle.cadenceSignals) {
      expect(c.heuristicOnly).toBe(true);
      expect(c.advisoryOnly).toBe(true);
      expect(c.symbolicExecution).toBe(true);
    }
  });

  it("briefings avoid autonomous / conversational product wording", async () => {
    const isr = stubIsrBundle();
    const getBundleWithCacheMeta = vi.fn().mockResolvedValue({ bundle: isr, composeCacheHit: false });
    const flags = {
      isEnabled: vi.fn(async (key: string) => {
        if (key.endsWith("_realtime_enabled")) return false;
        if (
          key === "industrial_operational_continuity_enabled" ||
          key === "industrial_situation_room_enabled" ||
          key === "economic_command_enabled" ||
          key === "economic_coordination_enabled"
        ) {
          return true;
        }
        return false;
      }),
    };
    const engine = new IndustrialOperationalContinuityEngineService(
      flags as never,
      { getBundleWithCacheMeta } as never,
      { publishContinuityPulse: vi.fn() } as never,
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
    expect(blob).not.toContain("assistant");
    expect(blob).not.toContain("we recommend");
    expect(blob).not.toContain("ai suggests");
  });
});
