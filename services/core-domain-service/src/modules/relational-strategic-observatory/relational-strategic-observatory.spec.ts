/**
 * Instruction 20.39 — strategic command engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { StrategicObservatoryCorridorContext } from "./relational-strategic-observatory-corridor-context.service";
import { RelationalStrategicObservatoryBalanceService } from "./relational-strategic-observatory-balance.service";
import { RelationalStrategicObservatoryEngineService } from "./relational-strategic-observatory-engine.service";
import { RelationalStrategicObservatoryGridService } from "./relational-strategic-observatory-grid.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";
import { RelationalStrategicObservatoryPriorityService } from "./relational-strategic-observatory-priority.service";
import { RelationalStrategicObservatoryRiskService } from "./relational-strategic-observatory-risk.service";

const baseCtx: StrategicObservatoryCorridorContext = {
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
  topExecutiveExposure: 61,
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
  activeGlobalExecutiveSupervisionNodeId: "00000000-0000-4000-8000-0000000000gs1",
  topGlobalExecutiveSupervisionScore: 54,
  topGlobalExecutiveSupervisionExecutivePressure: 56,
  topGlobalExecutiveSupervisionSystemicExposure: 53,
  priorStrategicObservatoryNodeCount: 0,
};

describe("RelationalStrategicObservatoryPolicyService", () => {
  const policy = new RelationalStrategicObservatoryPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertStrategicObservatoryMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.strategicObservatoryMutationRejected).toBe(true);
  });
});

describe("RelationalStrategicObservatoryEngineService", () => {
  const policy = new RelationalStrategicObservatoryPolicyService();
  const engine = new RelationalStrategicObservatoryEngineService(
    policy,
    new RelationalStrategicObservatoryPriorityService(policy),
    new RelationalStrategicObservatoryRiskService(policy),
    new RelationalStrategicObservatoryBalanceService(),
  );

  it("computes bounded executive operations scores", () => {
    const state = engine.computeStrategicObservatoryState(baseCtx);
    expect(state.observatoryScore).toBeLessThanOrEqual(100);
    expect(state.systemicPressure).toBeLessThanOrEqual(100);
    expect(state.executiveExposure).toBeLessThanOrEqual(100);
    expect(state.strategicAlignmentScore).toBeLessThanOrEqual(100);
    expect(state.commandPressure).toBeLessThanOrEqual(100);
  });

  it("detects coordination collapse under concentration stress", () => {
    const stressed = { ...baseCtx, topCommandExecutiveConcentration: 80, governanceConflictCount: 4 };
    const state = engine.computeStrategicObservatoryState(stressed);
    expect(state.systemicConcentrationDetected).toBe(true);
  });
});

describe("RelationalStrategicObservatoryGridService", () => {
  const policy = new RelationalStrategicObservatoryPolicyService();
  const gridSvc = new RelationalStrategicObservatoryGridService(
    policy,
    new RelationalStrategicObservatoryPriorityService(policy),
  );
  const engine = new RelationalStrategicObservatoryEngineService(
    policy,
    new RelationalStrategicObservatoryPriorityService(policy),
    new RelationalStrategicObservatoryRiskService(policy),
    new RelationalStrategicObservatoryBalanceService(),
  );

  it("produces deterministic template grids from scores", () => {
    const state = engine.computeStrategicObservatoryState(baseCtx);
    const grids = gridSvc.generateStrategicObservatoryGrids(baseCtx, state);
    expect(grids.length).toBe(7);
    expect(grids[0]!.summary).toContain(String(state.observatoryScore));
    expect(grids[0]!.institutionalPressure).toBeLessThanOrEqual(100);
  });
});
