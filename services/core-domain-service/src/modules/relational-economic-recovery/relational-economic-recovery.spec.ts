/**
 * Instruction 20.29 — recovery planning engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { EconomicRecoveryCorridorContext } from "./relational-economic-recovery-corridor-context.service";
import { RelationalEconomicRecoveryDependencyService } from "./relational-economic-recovery-dependency.service";
import { RelationalEconomicRecoveryPlanningService } from "./relational-economic-recovery-planning.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";
import { RelationalEconomicRecoveryPriorityService } from "./relational-economic-recovery-priority.service";
import { RelationalEconomicRecoveryRiskService } from "./relational-economic-recovery-risk.service";

const baseCtx: EconomicRecoveryCorridorContext = {
  relationshipId: "00000000-0000-4000-8000-000000000001",
  hasOrder: true,
  buyerOrganizationId: "00000000-0000-4000-8000-0000000000b1",
  sellerOrganizationId: "00000000-0000-4000-8000-0000000000b2",
  territoryCountry: "SN",
  territoryCity: "DK",
  sectorSlug: "agro",
  geoZoneId: null,
  primarySovereigntyNodeId: "00000000-0000-4000-8000-0000000000s1",
  primaryContinuityNodeId: "00000000-0000-4000-8000-0000000000c1",
  primaryMacroNodeId: "00000000-0000-4000-8000-0000000000m1",
  primarySupplyFlowNodeId: null,
  sovereigntyScore: 48,
  autonomyScore: 42,
  strategicCaptivityRisk: 58,
  dependencyExposureScore: 62,
  systemicAutonomyRisk: 55,
  corridorSelfRecoveryProbability: 0.42,
  continuityScore: 50,
  continuityInstability: 48,
  macroStructuralFragility: 40,
  macroPropagationRisk: 38,
  supplyFlowDisruptionAvg: 30,
  pressureScore: 44,
  macroDependencyCount: 2,
  supplyFlowEdgeCount: 2,
  sovereigntyDependencyCount: 1,
  continuityDependencyCount: 1,
  openIncidentCount: 0,
  strategicMemoryActiveCount: 1,
  orchestrationOpenCount: 0,
  predictiveHighRiskCount: 0,
  priorRecoveryPlanCount: 0,
  heuristicFallbackUsed: false,
  fallbackReasons: [],
};

describe("RelationalEconomicRecoveryPolicyService", () => {
  const policy = new RelationalEconomicRecoveryPolicyService();

  it("assertEconomicRecoveryMutationAllowed blocks TERMINATED", () => {
    const t = policy.assertEconomicRecoveryMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(t.allowed).toBe(false);
    expect(t.diagnostics.recoveryMutationRejected).toBe(true);
    expect(t.diagnostics.corridorTerminated).toBe(true);
  });

  it("VENEXT_RECOVERY_MAX_DEPTH clamps traversal", () => {
    const prev = process.env.VENEXT_RECOVERY_MAX_DEPTH;
    process.env.VENEXT_RECOVERY_MAX_DEPTH = "2";
    expect(new RelationalEconomicRecoveryPolicyService().maxRecoveryDepth()).toBe(2);
    if (prev === undefined) delete process.env.VENEXT_RECOVERY_MAX_DEPTH;
    else process.env.VENEXT_RECOVERY_MAX_DEPTH = prev;
  });
});

describe("RelationalEconomicRecoveryPlanningService", () => {
  const planning = new RelationalEconomicRecoveryPlanningService(
    new RelationalEconomicRecoveryPolicyService(),
    new RelationalEconomicRecoveryPriorityService(new RelationalEconomicRecoveryPolicyService()),
    new RelationalEconomicRecoveryRiskService(new RelationalEconomicRecoveryPolicyService()),
    new RelationalEconomicRecoveryDependencyService({} as never, new RelationalEconomicRecoveryPolicyService()),
  );

  it("generates 10 sequenced recovery steps without autopilot", async () => {
    const plan = await planning.generateRecoveryPlan(baseCtx, {
      traversalDepth: 1,
      boundedTraversalApplied: false,
      visitedNodes: 2,
      recoveryEdgeCount: 1,
      recoveryChains: [],
      recoveryBottlenecks: [],
      recoveryBlockers: [],
    });
    expect(plan.steps).toHaveLength(10);
    expect(plan.steps[0]?.stepType).toBe("PRIORITY_STABILIZATION");
    expect(plan.diagnostics.planningOnly).toBe(true);
    expect(plan.recoveryScore).toBeGreaterThanOrEqual(0);
    expect(plan.recoveryScore).toBeLessThanOrEqual(100);
  });
});

describe("RelationalEconomicRecoveryDependencyService", () => {
  it("DFS respects VENEXT_RECOVERY_MAX_DEPTH", async () => {
    const prev = process.env.VENEXT_RECOVERY_MAX_DEPTH;
    process.env.VENEXT_RECOVERY_MAX_DEPTH = "1";
    const a = "00000000-0000-4000-8000-000000000001";
    const b = "00000000-0000-4000-8000-000000000002";
    const prisma = {
      relationalEconomicSovereigntyDependency: {
        findMany: vi.fn().mockResolvedValue([
          { sourceSovereigntyNodeId: a, targetSovereigntyNodeId: b, captivityTransferScore: 50 },
        ]),
      },
    } as never;
    const svc = new RelationalEconomicRecoveryDependencyService(prisma, new RelationalEconomicRecoveryPolicyService());
    const r = await svc.buildRecoveryDependencyMap("00000000-0000-4000-8000-00000000abcd");
    if (prev === undefined) delete process.env.VENEXT_RECOVERY_MAX_DEPTH;
    else process.env.VENEXT_RECOVERY_MAX_DEPTH = prev;
    expect(r.traversalDepth).toBeLessThanOrEqual(1);
    expect(r).toHaveProperty("boundedTraversalApplied");
  });
});

describe("RelationalEconomicRecoveryPriorityService", () => {
  it("raises priority with higher instability", () => {
    const svc = new RelationalEconomicRecoveryPriorityService(new RelationalEconomicRecoveryPolicyService());
    const low = svc.computePriority(baseCtx);
    const high = svc.computePriority({ ...baseCtx, continuityInstability: 85, openIncidentCount: 3 });
    expect(high.recoveryPriorityScore).toBeGreaterThanOrEqual(low.recoveryPriorityScore);
  });
});
