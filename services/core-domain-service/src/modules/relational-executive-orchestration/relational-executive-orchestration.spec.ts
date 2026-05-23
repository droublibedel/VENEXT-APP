/**
 * Instruction 20.34 — executive orchestration engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { ExecutiveOrchestrationCorridorContext } from "./relational-executive-orchestration-corridor-context.service";
import { RelationalExecutiveOrchestrationBalanceService } from "./relational-executive-orchestration-balance.service";
import { RelationalExecutiveOrchestrationDependencyService } from "./relational-executive-orchestration-dependency.service";
import { RelationalExecutiveOrchestrationEngineService } from "./relational-executive-orchestration-engine.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";
import { RelationalExecutiveOrchestrationPriorityService } from "./relational-executive-orchestration-priority.service";
import { RelationalExecutiveOrchestrationRiskService } from "./relational-executive-orchestration-risk.service";

const baseCtx: ExecutiveOrchestrationCorridorContext = {
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
  macroStructuralFragility: 72,
  macroPropagationRisk: 38,
  supplyFlowDisruptionAvg: 30,
  pressureScore: 44,
  macroDependencyCount: 2,
  supplyFlowEdgeCount: 2,
  sovereigntyDependencyCount: 1,
  continuityDependencyCount: 1,
  openIncidentCount: 2,
  strategicMemoryActiveCount: 1,
  orchestrationOpenCount: 1,
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
  peerRelationshipCount: 4,
  priorGovernanceNodeCount: 0,
  governanceConflictCount: 2,
  topConflictPressure: 62,
  activeGovernanceNodeId: null,
  governanceConflicts: [],
  activeArbitrationCaseId: null,
  topArbitrationScore: 58,
  topArbitrationUrgency: 60,
  activeGovernanceScore: 54,
  activeGovernanceStability: 48,
  priorStabilizationNodeCount: 0,
  activeStabilizationNodeId: null,
  topStabilizationScore: 52,
  topStabilizationUrgency: 58,
  topInstabilityPressure: 55,
  priorMonitoringNodeCount: 0,
  activeMonitoringNodeId: "00000000-0000-4000-8000-0000000000m1",
  topMonitoringScore: 56,
  topExecutivePressure: 61,
  topSystemicRisk: 54,
  priorExecutiveOrchestrationNodeCount: 0,
};

describe("RelationalExecutiveOrchestrationPolicyService", () => {
  const policy = new RelationalExecutiveOrchestrationPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertExecutiveOrchestrationMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.executiveOrchestrationMutationRejected).toBe(true);
  });
});

describe("RelationalExecutiveOrchestrationEngineService", () => {
  const policy = new RelationalExecutiveOrchestrationPolicyService();
  const engine = new RelationalExecutiveOrchestrationEngineService(
    policy,
    new RelationalExecutiveOrchestrationPriorityService(policy),
    new RelationalExecutiveOrchestrationRiskService(policy),
    new RelationalExecutiveOrchestrationBalanceService(),
  );

  it("computes bounded orchestration scores", () => {
    const state = engine.computeExecutiveOrchestrationState(baseCtx);
    expect(state.orchestrationScore).toBeLessThanOrEqual(100);
    expect(state.executiveCoordinationPressure).toBeLessThanOrEqual(100);
    expect(state.systemicExposure).toBeLessThanOrEqual(100);
    expect(state.strategicAlignmentScore).toBeLessThanOrEqual(100);
  });

  it("detects coordination breakdown under pressure", () => {
    const stressed = { ...baseCtx, governanceConflictCount: 4, topExecutivePressure: 80 };
    const state = engine.computeExecutiveOrchestrationState(stressed);
    expect(state.coordinationBreakdownDetected).toBe(true);
  });
});

describe("RelationalExecutiveOrchestrationDependencyService", () => {
  const policy = new RelationalExecutiveOrchestrationPolicyService();
  const depSvc = new RelationalExecutiveOrchestrationDependencyService({} as never, policy);

  it("produces critical executive dependencies", () => {
    const deps = depSvc.detectCriticalExecutiveDependencies(baseCtx);
    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0]!.dependencyWeight).toBeLessThanOrEqual(100);
  });
});
