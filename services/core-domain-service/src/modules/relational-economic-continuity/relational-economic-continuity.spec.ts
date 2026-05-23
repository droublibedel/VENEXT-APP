/**
 * Instruction 20.26 — economic continuity engines (deterministic, bounded).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { RelationalEconomicContinuityDependencyService } from "./relational-economic-continuity-dependency.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";
import { RelationalEconomicContinuityRecoveryService } from "./relational-economic-continuity-recovery.service";
import { RelationalEconomicContinuityStabilityService } from "./relational-economic-continuity-stability.service";
import type { EconomicContinuityCorridorContext } from "./relational-economic-continuity-corridor-context.service";

const baseCtx: EconomicContinuityCorridorContext = {
  relationshipId: "00000000-0000-4000-8000-000000000001",
  hasOrder: true,
  buyerOrganizationId: "00000000-0000-4000-8000-0000000000b1",
  sellerOrganizationId: "00000000-0000-4000-8000-0000000000b2",
  territoryCountry: "SN",
  territoryCity: "DK",
  sectorNodeId: null,
  sectorSlug: null,
  geoZoneId: null,
  primarySupplyFlowNodeId: null,
  primaryMacroNodeId: "00000000-0000-4000-8000-0000000000m1",
  pressureScore: 44,
  fragilityScore: 33,
  geoFragilityScore: 20,
  sectorOperationalRisk: 40,
  sectorFragility: 35,
  supplyFlowDisruptionAvg: 30,
  macroResilienceScore: 55,
  macroStructuralFragility: 40,
  macroPropagationRisk: 35,
  macroEconomicStress: 38,
  openIncidentCount: 0,
  strategicMemoryActiveCount: 2,
  strategicMemoryAvgConfidence: 60,
  commandCenterStress: 25,
  peerPressureEdgeCount: 2,
  macroSnapshotCount: 3,
  continuitySnapshotCount: 2,
  macroPropagationEventCount: 1,
  snapshotResilienceTrend: -2,
  heuristicFallbackUsed: false,
  fallbackReasons: [],
};

describe("RelationalEconomicContinuityPolicyService", () => {
  const policy = new RelationalEconomicContinuityPolicyService();

  it("assertEconomicContinuityMutationAllowed blocks TERMINATED", () => {
    expect(policy.assertEconomicContinuityMutationAllowed(CommercialCorridorState.TERMINATED).allowed).toBe(false);
    const t = policy.assertEconomicContinuityMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(t.diagnostics.corridorTerminated).toBe(true);
    expect(t.diagnostics.continuityMutationRejected).toBe(true);
    expect(t.diagnostics.mutationSkippedReason).toBe("corridor_terminated");
  });

  it("VENEXT_CONTINUITY_MAX_DEPTH clamps recovery depth", () => {
    const prev = process.env.VENEXT_CONTINUITY_MAX_DEPTH;
    process.env.VENEXT_CONTINUITY_MAX_DEPTH = "2";
    expect(new RelationalEconomicContinuityPolicyService().maxRecoveryDepth()).toBe(2);
    if (prev === undefined) delete process.env.VENEXT_CONTINUITY_MAX_DEPTH;
    else process.env.VENEXT_CONTINUITY_MAX_DEPTH = prev;
  });
});

describe("RelationalEconomicContinuityStabilityService", () => {
  it("computes bounded continuity scores with diagnostics", () => {
    const stability = new RelationalEconomicContinuityStabilityService(new RelationalEconomicContinuityPolicyService());
    const low = stability.computeStability(baseCtx);
    const high = stability.computeStability({
      ...baseCtx,
      openIncidentCount: 5,
      macroStructuralFragility: 85,
      snapshotResilienceTrend: -15,
    });
    expect(high.instabilityRisk).toBeGreaterThan(low.instabilityRisk);
    expect(high.continuityScore).toBeLessThanOrEqual(100);
    expect(low.diagnostics).toHaveProperty("computedFrom");
  });
});

describe("RelationalEconomicContinuityDependencyService", () => {
  it("varies dependency durability with propagation history", () => {
    const stability = new RelationalEconomicContinuityStabilityService(new RelationalEconomicContinuityPolicyService());
    const scores = stability.computeStability(baseCtx);
    const a = RelationalEconomicContinuityDependencyService.computeCorridorDependency({
      relationshipId: baseCtx.relationshipId,
      stability: scores,
      ctx: baseCtx,
    });
    const b = RelationalEconomicContinuityDependencyService.computeCorridorDependency({
      relationshipId: baseCtx.relationshipId,
      stability: scores,
      ctx: { ...baseCtx, macroPropagationEventCount: 6 },
    });
    expect(b.dependencyDurability).toBeLessThanOrEqual(a.dependencyDurability);
    expect(b.instabilityType).toBeDefined();
  });
});

describe("RelationalEconomicContinuityRecoveryService", () => {
  it("DFS respects VENEXT_CONTINUITY_MAX_DEPTH", async () => {
    const prev = process.env.VENEXT_CONTINUITY_MAX_DEPTH;
    process.env.VENEXT_CONTINUITY_MAX_DEPTH = "1";
    const policy = new RelationalEconomicContinuityPolicyService();
    const a = "00000000-0000-4000-8000-000000000001";
    const b = "00000000-0000-4000-8000-000000000002";
    const prisma = {
      relationalEconomicContinuityDependency: {
        findMany: vi.fn().mockResolvedValue([
          { sourceContinuityNodeId: a, targetContinuityNodeId: b, continuityTransferScore: 40 },
        ]),
      },
    } as never;
    const svc = new RelationalEconomicContinuityRecoveryService(prisma, policy);
    const r = await svc.buildRecoveryMap("00000000-0000-4000-8000-00000000abcd");
    if (prev === undefined) delete process.env.VENEXT_CONTINUITY_MAX_DEPTH;
    else process.env.VENEXT_CONTINUITY_MAX_DEPTH = prev;
    expect(r.recoveryDiagnostics.traversalDepth).toBeLessThanOrEqual(1);
    expect(r.recoveryDiagnostics).toHaveProperty("continuityExposure");
  });
});
