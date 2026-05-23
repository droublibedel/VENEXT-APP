/**
 * Instruction 20.38 — strategic command engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { ExecutiveOperationsCorridorContext } from "./relational-executive-operations-corridor-context.service";
import { RelationalExecutiveOperationsBalanceService } from "./relational-executive-operations-balance.service";
import { RelationalExecutiveOperationsEngineService } from "./relational-executive-operations-engine.service";
import { RelationalExecutiveOperationsMatrixService } from "./relational-executive-operations-matrix.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";
import { RelationalExecutiveOperationsPriorityService } from "./relational-executive-operations-priority.service";
import { RelationalExecutiveOperationsRiskService } from "./relational-executive-operations-risk.service";

const baseCtx: ExecutiveOperationsCorridorContext = {
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
};

describe("RelationalExecutiveOperationsPolicyService", () => {
  const policy = new RelationalExecutiveOperationsPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertExecutiveOperationsMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.executiveOperationsMutationRejected).toBe(true);
  });
});

describe("RelationalExecutiveOperationsEngineService", () => {
  const policy = new RelationalExecutiveOperationsPolicyService();
  const engine = new RelationalExecutiveOperationsEngineService(
    policy,
    new RelationalExecutiveOperationsPriorityService(policy),
    new RelationalExecutiveOperationsRiskService(policy),
    new RelationalExecutiveOperationsBalanceService(),
  );

  it("computes bounded executive operations scores", () => {
    const state = engine.computeExecutiveOperationsState(baseCtx);
    expect(state.executiveOperationsScore).toBeLessThanOrEqual(100);
    expect(state.systemicConcentration).toBeLessThanOrEqual(100);
    expect(state.executivePressure).toBeLessThanOrEqual(100);
    expect(state.strategicBalanceScore).toBeLessThanOrEqual(100);
    expect(state.commandPressure).toBeLessThanOrEqual(100);
  });

  it("detects coordination collapse under concentration stress", () => {
    const stressed = { ...baseCtx, topCommandExecutiveConcentration: 80, governanceConflictCount: 4 };
    const state = engine.computeExecutiveOperationsState(stressed);
    expect(state.coordinationCollapseDetected).toBe(true);
  });
});

describe("RelationalExecutiveOperationsMatrixService", () => {
  const policy = new RelationalExecutiveOperationsPolicyService();
  const matrixSvc = new RelationalExecutiveOperationsMatrixService(
    policy,
    new RelationalExecutiveOperationsPriorityService(policy),
  );
  const engine = new RelationalExecutiveOperationsEngineService(
    policy,
    new RelationalExecutiveOperationsPriorityService(policy),
    new RelationalExecutiveOperationsRiskService(policy),
    new RelationalExecutiveOperationsBalanceService(),
  );

  it("produces deterministic template grids from scores", () => {
    const state = engine.computeExecutiveOperationsState(baseCtx);
    const grids = matrixSvc.generateExecutiveOperationsMatrices(baseCtx, state);
    expect(grids.length).toBe(7);
    expect(grids[0]!.summary).toContain(String(state.executiveOperationsScore));
    expect(grids[0]!.institutionalPressure).toBeLessThanOrEqual(100);
  });
});
