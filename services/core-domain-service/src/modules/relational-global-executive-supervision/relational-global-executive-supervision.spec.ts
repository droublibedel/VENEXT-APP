/**
 * Instruction 20.39 — strategic command engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { GlobalExecutiveSupervisionCorridorContext } from "./relational-global-executive-supervision-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionBalanceService } from "./relational-global-executive-supervision-balance.service";
import { RelationalGlobalExecutiveSupervisionEngineService } from "./relational-global-executive-supervision-engine.service";
import { RelationalGlobalExecutiveSupervisionMatrixService } from "./relational-global-executive-supervision-matrix.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";
import { RelationalGlobalExecutiveSupervisionPriorityService } from "./relational-global-executive-supervision-priority.service";
import { RelationalGlobalExecutiveSupervisionRiskService } from "./relational-global-executive-supervision-risk.service";

const baseCtx: GlobalExecutiveSupervisionCorridorContext = {
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
  activeExecutiveOrchestrationNodeId: "00000000-0000-4000-8000-0000000000o1",
  topOrchestrationScore: 58,
  topExecutiveCoordinationPressure: 64,
  priorInstitutionalReportingNodeCount: 0,
  activeInstitutionalReportingNodeId: "00000000-0000-4000-8000-0000000000i1",
  topInstitutionalScore: 62,
  topInstitutionalExecutiveRisk: 55,
  priorStrategicIntelligenceNodeCount: 0,
  activeStrategicIntelligenceNodeId: "00000000-0000-4000-8000-0000000000s1",
  topStrategicIntelligenceScore: 60,
  topStrategicExecutiveConcentration: 58,
  priorStrategicCommandNodeCount: 0,
  activeStrategicCommandNodeId: "00000000-0000-4000-8000-0000000000c1",
  topCommandScore: 58,
  topCommandExecutiveConcentration: 56,
  priorExecutiveOperationsNodeCount: 0,
  activeExecutiveOperationsNodeId: "00000000-0000-4000-8000-0000000000e1",
  topOperationsScore: 57,
  topOperationsExecutivePressure: 59,
  activeExecutiveControlRoomNodeId: "00000000-0000-4000-8000-0000000000cr1",
  topControlRoomScore: 56,
  topControlRoomExecutivePressure: 58,
  priorExecutiveStrategicSynthesisNodeCount: 0,
  activeExecutiveStrategicSynthesisNodeId: "00000000-0000-4000-8000-0000000000ss1",
  topStrategicSynthesisScore: 55,
  topStrategicSynthesisExecutiveExposure: 57,
  topStrategicSynthesisSystemicPressure: 54,
  priorGlobalExecutiveSupervisionNodeCount: 0,
};

describe("RelationalGlobalExecutiveSupervisionPolicyService", () => {
  const policy = new RelationalGlobalExecutiveSupervisionPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertGlobalExecutiveSupervisionMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.globalExecutiveSupervisionMutationRejected).toBe(true);
  });
});

describe("RelationalGlobalExecutiveSupervisionEngineService", () => {
  const policy = new RelationalGlobalExecutiveSupervisionPolicyService();
  const engine = new RelationalGlobalExecutiveSupervisionEngineService(
    policy,
    new RelationalGlobalExecutiveSupervisionPriorityService(policy),
    new RelationalGlobalExecutiveSupervisionRiskService(policy),
    new RelationalGlobalExecutiveSupervisionBalanceService(),
  );

  it("computes bounded executive operations scores", () => {
    const state = engine.computeGlobalExecutiveSupervisionState(baseCtx);
    expect(state.supervisionScore).toBeLessThanOrEqual(100);
    expect(state.systemicExposure).toBeLessThanOrEqual(100);
    expect(state.executivePressure).toBeLessThanOrEqual(100);
    expect(state.strategicAlignmentScore).toBeLessThanOrEqual(100);
    expect(state.commandPressure).toBeLessThanOrEqual(100);
  });

  it("detects coordination collapse under concentration stress", () => {
    const stressed = { ...baseCtx, topCommandExecutiveConcentration: 80, governanceConflictCount: 4 };
    const state = engine.computeGlobalExecutiveSupervisionState(stressed);
    expect(state.systemicConcentrationDetected).toBe(true);
  });
});

describe("RelationalGlobalExecutiveSupervisionMatrixService", () => {
  const policy = new RelationalGlobalExecutiveSupervisionPolicyService();
  const matrixSvc = new RelationalGlobalExecutiveSupervisionMatrixService(
    policy,
    new RelationalGlobalExecutiveSupervisionPriorityService(policy),
  );
  const engine = new RelationalGlobalExecutiveSupervisionEngineService(
    policy,
    new RelationalGlobalExecutiveSupervisionPriorityService(policy),
    new RelationalGlobalExecutiveSupervisionRiskService(policy),
    new RelationalGlobalExecutiveSupervisionBalanceService(),
  );

  it("produces deterministic template grids from scores", () => {
    const state = engine.computeGlobalExecutiveSupervisionState(baseCtx);
    const matrices = matrixSvc.generateGlobalExecutiveSupervisionMatrices(baseCtx, state);
    expect(matrices.length).toBe(7);
    expect(matrices[0]!.summary).toContain(String(state.supervisionScore));
    expect(matrices[0]!.institutionalPressure).toBeLessThanOrEqual(100);
  });
});
