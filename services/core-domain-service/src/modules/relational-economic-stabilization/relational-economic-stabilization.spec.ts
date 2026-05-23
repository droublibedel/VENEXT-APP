/**
 * Instruction 20.32 — stabilization engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { EconomicStabilizationCorridorContext } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationDependencyService } from "./relational-economic-stabilization-dependency.service";
import { RelationalEconomicStabilizationEngineService } from "./relational-economic-stabilization-engine.service";
import { RelationalEconomicStabilizationPolicyService, VENEXT_STABILIZATION_MAX_DEPTH } from "./relational-economic-stabilization-policy.service";
import { RelationalEconomicStabilizationPressureService } from "./relational-economic-stabilization-pressure.service";
import { RelationalEconomicStabilizationResilienceService } from "./relational-economic-stabilization-resilience.service";
import { RelationalEconomicStabilizationRiskService } from "./relational-economic-stabilization-risk.service";
import { RelationalEconomicStabilizationBalanceService } from "./relational-economic-stabilization-balance.service";

const baseCtx: EconomicStabilizationCorridorContext = {
  relationshipId: "00000000-0000-4000-8000-000000000001",
  hasOrder: true,
  buyerOrganizationId: "00000000-0000-4000-8000-0000000000b1",
  sellerOrganizationId: "00000000-0000-4000-8000-0000000000b2",
  territoryCountry: "SN",
  territoryCity: "DK",
  sectorSlug: "agro",
  geoZoneId: null,
  primarySovereigntyNodeId: null,
  primaryContinuityNodeId: null,
  primaryMacroNodeId: null,
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
  activeRecoveryPlanId: null,
  activeRecoveryScore: 52,
  activeRecoveryInstability: 58,
  activeRecoveryInterventionPriority: 64,
  dependencyNodeId: null,
  dependencyScore: 55,
  pressureGraphScore: 44,
  peerRelationshipCount: 3,
  priorGovernanceNodeCount: 0,
  governanceConflictCount: 1,
  topConflictPressure: 62,
  activeGovernanceNodeId: null,
  governanceConflicts: [],
  activeArbitrationCaseId: null,
  topArbitrationScore: 58,
  topArbitrationUrgency: 60,
  activeGovernanceScore: 54,
  activeGovernanceStability: 48,
  priorStabilizationNodeCount: 0,
};

describe("RelationalEconomicStabilizationPolicyService", () => {
  const policy = new RelationalEconomicStabilizationPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertEconomicStabilizationMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.stabilizationMutationRejected).toBe(true);
    expect(gate.diagnostics.corridorTerminated).toBe(true);
  });

  it("exports bounded traversal depth", () => {
    expect(VENEXT_STABILIZATION_MAX_DEPTH).toBe(6);
  });
});

describe("RelationalEconomicStabilizationEngineService", () => {
  const engine = new RelationalEconomicStabilizationEngineService(
    new RelationalEconomicStabilizationPolicyService(),
    new RelationalEconomicStabilizationPressureService(new RelationalEconomicStabilizationPolicyService()),
    new RelationalEconomicStabilizationRiskService(new RelationalEconomicStabilizationPolicyService()),
    new RelationalEconomicStabilizationBalanceService(new RelationalEconomicStabilizationPolicyService()),
  );

  it("computes bounded stabilization scores", () => {
    const state = engine.computeStabilizationState(baseCtx);
    expect(state.stabilizationScore).toBeGreaterThanOrEqual(0);
    expect(state.stabilizationScore).toBeLessThanOrEqual(100);
    expect(state.instabilityPressure).toBeLessThanOrEqual(100);
    expect(state.resilienceLevel).toBeLessThanOrEqual(100);
    expect(state.systemicExposure).toBeLessThanOrEqual(100);
  });

  it("detects strategic instability under pressure", () => {
    const highPressure = { ...baseCtx, topArbitrationUrgency: 80, openIncidentCount: 3 };
    const state = engine.computeStabilizationState(highPressure);
    expect(state.strategicInstabilityDetected).toBe(true);
  });
});

describe("RelationalEconomicStabilizationDependencyService", () => {
  const dep = new RelationalEconomicStabilizationDependencyService(
    { relationship: { findMany: async () => [] } } as never,
    new RelationalEconomicStabilizationPolicyService(),
  );

  it("detects critical dependency drafts", () => {
    const drafts = dep.detectCriticalDependencies(baseCtx);
    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts[0]!.dependencyWeight).toBeLessThanOrEqual(100);
  });
});

describe("RelationalEconomicStabilizationResilienceService", () => {
  const policy = new RelationalEconomicStabilizationPolicyService();
  const engine = new RelationalEconomicStabilizationEngineService(
    policy,
    new RelationalEconomicStabilizationPressureService(policy),
    new RelationalEconomicStabilizationRiskService(policy),
    new RelationalEconomicStabilizationBalanceService(policy),
  );
  const resilience = new RelationalEconomicStabilizationResilienceService(policy, engine);

  it("projects resilience metrics in bounds", () => {
    const p = resilience.projectResilience(baseCtx);
    expect(p.resiliencePotential).toBeLessThanOrEqual(100);
    expect(p.systemicRecoveryProbability).toBeLessThanOrEqual(100);
  });
});
