/**
 * Instruction 20.35 — institutional reporting engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { InstitutionalReportingCorridorContext } from "./relational-institutional-reporting-corridor-context.service";
import { RelationalInstitutionalReportingBalanceService } from "./relational-institutional-reporting-balance.service";
import { RelationalInstitutionalReportingBriefService } from "./relational-institutional-reporting-brief.service";
import { RelationalInstitutionalReportingEngineService } from "./relational-institutional-reporting-engine.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";
import { RelationalInstitutionalReportingPriorityService } from "./relational-institutional-reporting-priority.service";
import { RelationalInstitutionalReportingRiskService } from "./relational-institutional-reporting-risk.service";

const baseCtx: InstitutionalReportingCorridorContext = {
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
};

describe("RelationalInstitutionalReportingPolicyService", () => {
  const policy = new RelationalInstitutionalReportingPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertInstitutionalReportingMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.institutionalReportingMutationRejected).toBe(true);
  });
});

describe("RelationalInstitutionalReportingEngineService", () => {
  const policy = new RelationalInstitutionalReportingPolicyService();
  const engine = new RelationalInstitutionalReportingEngineService(
    policy,
    new RelationalInstitutionalReportingPriorityService(policy),
    new RelationalInstitutionalReportingRiskService(policy),
    new RelationalInstitutionalReportingBalanceService(),
  );

  it("computes bounded institutional scores", () => {
    const state = engine.computeInstitutionalReportingState(baseCtx);
    expect(state.institutionalScore).toBeLessThanOrEqual(100);
    expect(state.executiveRisk).toBeLessThanOrEqual(100);
    expect(state.systemicExposure).toBeLessThanOrEqual(100);
    expect(state.strategicAlignmentScore).toBeLessThanOrEqual(100);
    expect(state.orchestrationPressure).toBeLessThanOrEqual(100);
  });

  it("detects executive pressure under coordination stress", () => {
    const stressed = { ...baseCtx, topExecutiveCoordinationPressure: 80, governanceConflictCount: 4 };
    const state = engine.computeInstitutionalReportingState(stressed);
    expect(state.executivePressureDetected).toBe(true);
  });
});

describe("RelationalInstitutionalReportingBriefService", () => {
  const policy = new RelationalInstitutionalReportingPolicyService();
  const briefSvc = new RelationalInstitutionalReportingBriefService(
    policy,
    new RelationalInstitutionalReportingPriorityService(policy),
  );
  const engine = new RelationalInstitutionalReportingEngineService(
    policy,
    new RelationalInstitutionalReportingPriorityService(policy),
    new RelationalInstitutionalReportingRiskService(policy),
    new RelationalInstitutionalReportingBalanceService(),
  );

  it("produces deterministic template briefs from scores", () => {
    const state = engine.computeInstitutionalReportingState(baseCtx);
    const briefs = briefSvc.generateInstitutionalBriefs(baseCtx, state);
    expect(briefs.length).toBe(7);
    expect(briefs[0]!.summary).toContain(String(state.institutionalScore));
    expect(briefs[0]!.title.length).toBeGreaterThan(0);
    expect(briefs[0]!.institutionalPressure).toBeLessThanOrEqual(100);
  });
});
