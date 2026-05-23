/**
 * Instruction 20.27 — economic sovereignty engines (deterministic, bounded).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { RelationalEconomicSovereigntyAutonomyService } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyCalibrationService } from "./relational-economic-sovereignty-calibration.service";
import { RelationalEconomicSovereigntyDependencyService } from "./relational-economic-sovereignty-dependency.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";
import { RelationalEconomicSovereigntyRecoveryService } from "./relational-economic-sovereignty-recovery.service";
import type { EconomicSovereigntyCorridorContext } from "./relational-economic-sovereignty-corridor-context.service";

const baseCtx: EconomicSovereigntyCorridorContext = {
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
  primaryContinuityNodeId: "00000000-0000-4000-8000-0000000000c1",
  continuityScore: 55,
  continuityInstability: 40,
  continuityRecoveryProbability: 0.5,
  macroResilienceScore: 50,
  macroStructuralFragility: 42,
  macroPropagationRisk: 35,
  supplyFlowDisruptionAvg: 28,
  pressureScore: 44,
  peerPressureEdgeCount: 2,
  openIncidentCount: 0,
  strategicMemoryActiveCount: 2,
  orchestrationOpenCount: 0,
  macroDependencyCount: 1,
  supplyFlowEdgeCount: 2,
  continuitySnapshotCount: 3,
  heuristicFallbackUsed: false,
  fallbackReasons: [],
};

describe("RelationalEconomicSovereigntyPolicyService", () => {
  const policy = new RelationalEconomicSovereigntyPolicyService();

  it("assertEconomicSovereigntyMutationAllowed blocks TERMINATED", () => {
    expect(policy.assertEconomicSovereigntyMutationAllowed(CommercialCorridorState.TERMINATED).allowed).toBe(false);
    const t = policy.assertEconomicSovereigntyMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(t.diagnostics.sovereigntyMutationRejected).toBe(true);
    expect(t.diagnostics.corridorTerminated).toBe(true);
  });

  it("VENEXT_SOVEREIGNTY_MAX_DEPTH clamps traversal", () => {
    const prev = process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH;
    process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH = "2";
    expect(new RelationalEconomicSovereigntyPolicyService().maxSovereigntyDepth()).toBe(2);
    if (prev === undefined) delete process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH;
    else process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH = prev;
  });
});

describe("RelationalEconomicSovereigntyAutonomyService", () => {
  it("computes bounded autonomy scores with diagnostics", () => {
    const autonomy = new RelationalEconomicSovereigntyAutonomyService(
      new RelationalEconomicSovereigntyPolicyService(),
      new RelationalEconomicSovereigntyCalibrationService(),
    );
    const low = autonomy.computeAutonomy(baseCtx);
    const high = autonomy.computeAutonomy({
      ...baseCtx,
      macroDependencyCount: 6,
      supplyFlowEdgeCount: 5,
      openIncidentCount: 4,
    });
    expect(high.dependencyConcentration).toBeGreaterThan(low.dependencyConcentration);
    expect(high.strategicCaptivityRisk).toBeGreaterThanOrEqual(low.strategicCaptivityRisk);
    expect(low.diagnostics).toHaveProperty("computedFrom");
  });
});

describe("RelationalEconomicSovereigntyDependencyService", () => {
  it("detects higher concentration with macro dependencies", () => {
    const autonomy = new RelationalEconomicSovereigntyAutonomyService(
      new RelationalEconomicSovereigntyPolicyService(),
      new RelationalEconomicSovereigntyCalibrationService(),
    );
    const scores = autonomy.computeAutonomy(baseCtx);
    const a = RelationalEconomicSovereigntyDependencyService.computeCorridorDependency({
      relationshipId: baseCtx.relationshipId,
      autonomy: scores,
      ctx: baseCtx,
    });
    const b = RelationalEconomicSovereigntyDependencyService.computeCorridorDependency({
      relationshipId: baseCtx.relationshipId,
      autonomy: scores,
      ctx: { ...baseCtx, macroDependencyCount: 8 },
    });
    expect(b.dependencyConcentration).toBeGreaterThanOrEqual(a.dependencyConcentration);
  });
});

describe("RelationalEconomicSovereigntyRecoveryService", () => {
  it("DFS respects VENEXT_SOVEREIGNTY_MAX_DEPTH", async () => {
    const prev = process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH;
    process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH = "1";
    const policy = new RelationalEconomicSovereigntyPolicyService();
    const a = "00000000-0000-4000-8000-000000000001";
    const b = "00000000-0000-4000-8000-000000000002";
    const prisma = {
      relationalEconomicSovereigntyDependency: {
        findMany: vi.fn().mockResolvedValue([
          { sourceSovereigntyNodeId: a, targetSovereigntyNodeId: b, captivityTransferScore: 50 },
        ]),
      },
    } as never;
    const svc = new RelationalEconomicSovereigntyRecoveryService(
      prisma,
      policy,
      new RelationalEconomicSovereigntyCalibrationService(),
    );
    const r = await svc.buildRecoveryTraversal("00000000-0000-4000-8000-00000000abcd");
    if (prev === undefined) delete process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH;
    else process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH = prev;
    expect(r.recoveryDiagnostics.traversalDepth).toBeLessThanOrEqual(1);
    expect(r.recoveryDiagnostics).toHaveProperty("autonomyExposure");
  });
});
