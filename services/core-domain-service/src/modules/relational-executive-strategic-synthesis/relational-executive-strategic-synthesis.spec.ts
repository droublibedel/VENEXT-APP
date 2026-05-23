/**
 * Instruction 20.39 — strategic command engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { ExecutiveStrategicSynthesisCorridorContext } from "./relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisBalanceService } from "./relational-executive-strategic-synthesis-balance.service";
import { RelationalExecutiveStrategicSynthesisEngineService } from "./relational-executive-strategic-synthesis-engine.service";
import { RelationalExecutiveStrategicSynthesisDigestService } from "./relational-executive-strategic-synthesis-digest.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";
import { RelationalExecutiveStrategicSynthesisPriorityService } from "./relational-executive-strategic-synthesis-priority.service";
import { RelationalExecutiveStrategicSynthesisRiskService } from "./relational-executive-strategic-synthesis-risk.service";

const baseCtx: ExecutiveStrategicSynthesisCorridorContext = {
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
};

describe("RelationalExecutiveStrategicSynthesisPolicyService", () => {
  const policy = new RelationalExecutiveStrategicSynthesisPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertExecutiveStrategicSynthesisMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.executiveStrategicSynthesisMutationRejected).toBe(true);
  });
});

describe("RelationalExecutiveStrategicSynthesisEngineService", () => {
  const policy = new RelationalExecutiveStrategicSynthesisPolicyService();
  const engine = new RelationalExecutiveStrategicSynthesisEngineService(
    policy,
    new RelationalExecutiveStrategicSynthesisPriorityService(policy),
    new RelationalExecutiveStrategicSynthesisRiskService(policy),
    new RelationalExecutiveStrategicSynthesisBalanceService(),
  );

  it("computes bounded executive operations scores", () => {
    const state = engine.computeExecutiveStrategicSynthesisState(baseCtx);
    expect(state.synthesisScore).toBeLessThanOrEqual(100);
    expect(state.systemicPressure).toBeLessThanOrEqual(100);
    expect(state.executiveExposure).toBeLessThanOrEqual(100);
    expect(state.strategicAlignmentScore).toBeLessThanOrEqual(100);
    expect(state.commandPressure).toBeLessThanOrEqual(100);
  });

  it("detects coordination collapse under concentration stress", () => {
    const stressed = { ...baseCtx, topCommandExecutiveConcentration: 80, governanceConflictCount: 4 };
    const state = engine.computeExecutiveStrategicSynthesisState(stressed);
    expect(state.systemicEscalationDetected).toBe(true);
  });
});

describe("RelationalExecutiveStrategicSynthesisDigestService", () => {
  const policy = new RelationalExecutiveStrategicSynthesisPolicyService();
  const digestSvc = new RelationalExecutiveStrategicSynthesisDigestService(
    policy,
    new RelationalExecutiveStrategicSynthesisPriorityService(policy),
  );
  const engine = new RelationalExecutiveStrategicSynthesisEngineService(
    policy,
    new RelationalExecutiveStrategicSynthesisPriorityService(policy),
    new RelationalExecutiveStrategicSynthesisRiskService(policy),
    new RelationalExecutiveStrategicSynthesisBalanceService(),
  );

  it("produces deterministic template grids from scores", () => {
    const state = engine.computeExecutiveStrategicSynthesisState(baseCtx);
    const digests = digestSvc.generateExecutiveStrategicSynthesisDigests(baseCtx, state);
    expect(digests.length).toBe(7);
    expect(digests[0]!.summary).toContain(String(state.synthesisScore));
    expect(digests[0]!.institutionalPressure).toBeLessThanOrEqual(100);
  });
});
