/**
 * Instruction 20.30 — governance engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { EconomicGovernanceCorridorContext } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernanceBalanceService } from "./relational-economic-governance-balance.service";
import { RelationalEconomicGovernanceConflictService } from "./relational-economic-governance-conflict.service";
import { RelationalEconomicGovernanceCoordinationService } from "./relational-economic-governance-coordination.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";
import { RelationalEconomicGovernancePriorityService } from "./relational-economic-governance-priority.service";
import { RelationalEconomicGovernanceRiskService } from "./relational-economic-governance-risk.service";

const baseCtx: EconomicGovernanceCorridorContext = {
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
  activeRecoveryPlanId: "00000000-0000-4000-8000-0000000000r1",
  activeRecoveryScore: 52,
  activeRecoveryInstability: 58,
  activeRecoveryInterventionPriority: 64,
  dependencyNodeId: null,
  dependencyScore: 55,
  pressureGraphScore: 44,
  peerRelationshipCount: 3,
  priorGovernanceNodeCount: 0,
};

describe("RelationalEconomicGovernancePolicyService", () => {
  const policy = new RelationalEconomicGovernancePolicyService();

  it("assertEconomicGovernanceMutationAllowed blocks TERMINATED", () => {
    const t = policy.assertEconomicGovernanceMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(t.allowed).toBe(false);
    expect(t.diagnostics.governanceMutationRejected).toBe(true);
    expect(t.diagnostics.corridorTerminated).toBe(true);
  });

  it("VENEXT_GOVERNANCE_MAX_DEPTH clamps traversal", () => {
    const prev = process.env.VENEXT_GOVERNANCE_MAX_DEPTH;
    process.env.VENEXT_GOVERNANCE_MAX_DEPTH = "2";
    expect(new RelationalEconomicGovernancePolicyService().maxGovernanceDepth()).toBe(2);
    if (prev === undefined) delete process.env.VENEXT_GOVERNANCE_MAX_DEPTH;
    else process.env.VENEXT_GOVERNANCE_MAX_DEPTH = prev;
  });
});

describe("RelationalEconomicGovernanceCoordinationService", () => {
  const prisma = {
    relationalEconomicDependencyEdge: { count: vi.fn().mockResolvedValue(2) },
    relationship: { findMany: vi.fn().mockResolvedValue([{ id: baseCtx.relationshipId, corridorHealthScore: 40 }]) },
  } as never;

  const coordination = new RelationalEconomicGovernanceCoordinationService(
    prisma,
    new RelationalEconomicGovernancePolicyService(),
    new RelationalEconomicGovernancePriorityService(new RelationalEconomicGovernancePolicyService()),
    new RelationalEconomicGovernanceRiskService(new RelationalEconomicGovernancePolicyService()),
    new RelationalEconomicGovernanceBalanceService(new RelationalEconomicGovernancePolicyService()),
  );

  it("computes bounded governance state without autopilot", async () => {
    const state = await coordination.computeGovernanceState(baseCtx);
    expect(state.governanceScore).toBeGreaterThanOrEqual(0);
    expect(state.governanceScore).toBeLessThanOrEqual(100);
    expect(state.diagnostics.planningOnly).toBe(true);
    expect(state.diagnostics.nonAutopilot).toBe(true);
    expect(state.coordination.boundedTraversalApplied).toBeDefined();
  });
});

describe("RelationalEconomicGovernanceConflictService", () => {
  it("detects recovery conflicts when instability high", () => {
    const svc = new RelationalEconomicGovernanceConflictService(new RelationalEconomicGovernancePolicyService());
    const conflicts = svc.detectConflicts(baseCtx, {
      strategicCorridorRefs: [baseCtx.relationshipId],
      strategicCorridorCount: 1,
      coordinationOverload: 70,
      traversalDepth: 1,
      visitedCorridors: 1,
      boundedTraversalApplied: false,
      propagationEdgeCount: 2,
    });
    expect(conflicts.some((c) => c.conflictType === "RECOVERY_CONFLICT")).toBe(true);
  });
});

describe("RelationalEconomicGovernancePriorityService", () => {
  it("raises priority with higher instability", () => {
    const svc = new RelationalEconomicGovernancePriorityService(new RelationalEconomicGovernancePolicyService());
    const low = svc.computePriority(baseCtx);
    const high = svc.computePriority({
      ...baseCtx,
      activeRecoveryInstability: 85,
      openIncidentCount: 3,
    });
    expect(high.governancePriorityScore).toBeGreaterThanOrEqual(low.governancePriorityScore);
  });
});

describe("RelationalEconomicGovernanceBalanceService", () => {
  it("produces balance scores in range", () => {
    const svc = new RelationalEconomicGovernanceBalanceService(new RelationalEconomicGovernancePolicyService());
    const b = svc.computeBalance(baseCtx);
    expect(b.balanceScore).toBeGreaterThanOrEqual(0);
    expect(b.balanceScore).toBeLessThanOrEqual(100);
  });
});
