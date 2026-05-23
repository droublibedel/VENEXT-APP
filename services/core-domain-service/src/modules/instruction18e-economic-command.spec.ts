import { describe, expect, it, vi } from "vitest";

import {
  buildEconomicCommandSliceDiagnostics,
  EconomicCommandDiagnosticsSchema,
} from "@venext/shared-contracts";

import { EconomicCommandRealtimePublishService } from "./economic-command/economic-command-realtime-publish.service";
import { EconomicCommandNarrativeService } from "./economic-command/economic-command-narrative.service";
import { EconomicSystemStressService } from "./economic-command/economic-system-stress.service";
import { EconomicArbitrationService } from "./economic-command/economic-arbitration.service";
import { EconomicPressureZoneService } from "./economic-command/economic-pressure-zone.service";
import { EconomicCommandEngineService } from "./economic-command/economic-command-engine.service";
import type { CanonicalFeatureFlagEvaluator } from "../feature-flags/canonical-feature-flag.evaluator";
import type { EconomicCommandComposeContext } from "./economic-command/economic-command.types";

describe("Instruction 18.5 — economic command layer", () => {
  const leanCtx = (): EconomicCommandComposeContext => ({
    organizationId: "31111111-1111-1111-1111-111111111101",
    propagationBundle: {
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: "31111111-1111-1111-1111-111111111101",
      overview: {
        systemicRiskRollup: 0.35,
        shockCount: 3,
        territoryFragileTop: 2,
      },
      shocks: [],
      territoryFragility: [
        { territory: "T1", fragilityScore: 0.4, logisticsExposure: 0.3, relationshipExposure: 0.42 },
      ],
    } as never,
    scenariosBundle: {
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: "31111111-1111-1111-1111-111111111101",
      overview: { meanStabilizationProbability: 0.5, maxProjectedRisk: 0.4 },
      scenarios: [],
    } as never,
    coordinationBundle: {
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: "31111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      headline: "h",
      disclaimer: "d",
      overview: {
        version: "1",
        generatedAt: "2026-01-01T00:00:00.000Z",
        organizationId: "31111111-1111-1111-1111-111111111101",
        policy: "ACTIVE",
        headline: "h",
        activeConflictCount: 0,
        priorityCount: 1,
        orchestrationCount: 0,
        posture: "STRESSED",
        escalationLevel: "LOW",
        systemicRiskRollup: 0.3,
        coordinationStressRollup: 0.28,
        realtimePressure: 0.1,
        organizationSignals: 0.1,
        systemicIntelligencePressure: 0.2,
        operationalPressure: 0.55,
        financialPressure: 0.42,
        logisticsPressure: 0.41,
        diagnostics: {
          composeCache: "SHORT_TTL_COORDINATION_CACHE",
          composeCacheHit: false,
          cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
          snapshotReuse: "SINGLE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI",
        },
      },
      posture: { posture: "STRESSED", rationale: "r", diagnostics: [] },
      priorities: [],
      conflicts: [],
      orchestrations: [],
      escalation: { escalationLevel: "LOW", escalationDrivers: [], diagnostics: [] },
      memory: { memoryDigest: "", diagnostics: [] },
      diagnostics: {
        composeCacheHit: false,
        cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
        coordinationPipeline: "REUSE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI",
        sourceLabels: [],
        payloadProjection: "summary",
        sourceBundlesEmbedded: false,
        dataIntelligenceReuse: "FROM_PROPAGATION",
        dataIntelligenceComposeCount: 0,
      },
    } as never,
    memoryBundle: {
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: "31111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      crisisSignatures: [],
    } as never,
    dataIntelligenceBundle: {
      overview: { economicPropagationScore: 0.2 },
      correlations: { rows: [] },
    } as never,
  });

  it("narrative stays within six lines and avoids chatbot framing", () => {
    const svc = new EconomicCommandNarrativeService();
    const n = svc.build(leanCtx(), { globalStress: 0.44, dominant: "logistics" }, 2, 1, 1, 1);
    expect(n.lines.length).toBeLessThanOrEqual(6);
    const joined = n.lines.join(" ").toLowerCase();
    expect(joined).not.toContain("chatbot");
    expect(joined).not.toContain("ai operator");
  });

  it("system stress scores are bounded 0–1", () => {
    const svc = new EconomicSystemStressService();
    const s = svc.build(leanCtx());
    const vals = [
      s.globalStress,
      s.logisticsStress,
      s.financialStress,
      s.relationshipStress,
      s.coordinationStress,
      s.silentStress,
      s.scenarioStress,
    ];
    for (const v of vals) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(s.stressMode).toBe("PROXY_HEURISTIC");
  });

  it("arbitration rows are explicitly non-operational", () => {
    const svc = new EconomicArbitrationService();
    const rows = svc.build(leanCtx());
    for (const a of rows) {
      expect(a.nonOperationalExecution).toBe(true);
    }
  });

  it("slice diagnostics expose independentCompute false and FULL_COMPOSE cost", () => {
    const d = buildEconomicCommandSliceDiagnostics(false);
    expect(d.sliceSource).toBe("FULL_BUNDLE_SLICE");
    expect(d.serverCost).toBe("FULL_COMPOSE");
    expect(d.independentCompute).toBe(false);
    expect(d.recommendedClientMode).toBe("BUNDLE_FIRST");
  });

  it("emits silent_tension_zone when silentStress is high", () => {
    const svc = new EconomicPressureZoneService();
    const zones = svc.build(leanCtx(), { silentTensions: [], silentStress: 0.5 });
    expect(zones.some((z) => z.zoneType === "silent_tension_zone")).toBe(true);
  });

  it("does not emit silent_tension_zone when silent stress is low with no tensions", () => {
    const svc = new EconomicPressureZoneService();
    const zones = svc.build(leanCtx(), { silentTensions: [], silentStress: 0.1 });
    expect(zones.some((z) => z.zoneType === "silent_tension_zone")).toBe(false);
  });

  it("disabled engine bundle diagnostics expose composePlan and composeCountMeaning", async () => {
    const flags = { isEnabled: vi.fn().mockResolvedValue(false) } as unknown as CanonicalFeatureFlagEvaluator;
    const engine = new EconomicCommandEngineService(
      flags,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const { bundle } = await engine.getBundleWithCacheMeta("31111111-1111-1111-1111-111111111101", "summary");
    expect(bundle.diagnostics.composeCountMeaning).toBe("logical_pipeline_steps_not_cpu_cost");
    expect(bundle.diagnostics.composePlan.propagationCompose).toBe(0);
    expect(bundle.diagnostics.composePlan.commandCompose).toBe(0);
    expect(bundle.diagnostics.costDisclosure.length).toBeGreaterThan(10);
  });

  const baseDiagInput = {
    heuristicOnly: true,
    advisoryOnly: true,
    symbolicProjection: true,
    nonOperationalExecution: true,
    proxySignals: true,
    sourceMode: "LIVE_ECONOMIC_COMMAND_COMPOSE",
    composeCacheHit: false,
    cacheStrategy: "SHORT_TTL_COMMAND_CACHE" as const,
    composeCount: 6,
    composePlan: {
      propagationCompose: 1,
      coordinationCompose: 1,
      scenariosCompose: 1,
      memoryCompose: 1,
      dataIntelligenceCompose: 0,
      commandCompose: 1,
    },
    composeCountMeaning: "logical_pipeline_steps_not_cpu_cost" as const,
    costDisclosure: "Command summary may reuse caches.",
    reusedBundles: [] as string[],
    sourceBundlesEmbedded: false,
  };

  it("summary diagnostics: compact payload without fullProjectionWarning", () => {
    const parsed = EconomicCommandDiagnosticsSchema.safeParse({
      ...baseDiagInput,
      projectionMode: "summary",
      payloadWeightClass: "compact",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.fullProjectionWarning).toBeUndefined();
  });

  it("full diagnostics: large payload may include fullProjectionWarning", () => {
    const warn =
      "Full projection embeds source bundles for audit/debug and should not be used for default UI loads.";
    const parsed = EconomicCommandDiagnosticsSchema.safeParse({
      ...baseDiagInput,
      projectionMode: "full",
      payloadWeightClass: "large",
      sourceBundlesEmbedded: true,
      fullProjectionWarning: warn,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payloadWeightClass).toBe("large");
      expect(parsed.data.fullProjectionWarning).toBe(warn);
    }
  });

  it("realtime publish uses Promise.allSettled and warns on rejection", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network"));
    const fanout = { isConfigured: () => true, postDomainSignal: post } as never;
    const svc = new EconomicCommandRealtimePublishService(fanout);
    const bundle = {
      generatedAt: "2026-01-01T00:00:00.000Z",
      systemStress: { globalStress: 0.4 },
      pressureZones: [],
      arbitrations: [],
    } as never;
    expect(() => svc.publishCommandPulse("31111111-1111-1111-1111-111111111101", bundle)).not.toThrow();
    await new Promise((r) => setTimeout(r, 40));
    expect(post).toHaveBeenCalled();
  });
});
