/**
 * Instruction 20.36 — strategic intelligence engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { StrategicIntelligenceCorridorContext } from "./relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicIntelligenceBalanceService } from "./relational-strategic-intelligence-balance.service";
import { RelationalStrategicIntelligenceSynthesisService } from "./relational-strategic-intelligence-synthesis.service";
import { RelationalStrategicIntelligenceEngineService } from "./relational-strategic-intelligence-engine.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";
import { RelationalStrategicIntelligencePriorityService } from "./relational-strategic-intelligence-priority.service";
import { RelationalStrategicIntelligenceRiskService } from "./relational-strategic-intelligence-risk.service";

const baseCtx: StrategicIntelligenceCorridorContext = {
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
};

describe("RelationalStrategicIntelligencePolicyService", () => {
  const policy = new RelationalStrategicIntelligencePolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertStrategicIntelligenceMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.strategicIntelligenceMutationRejected).toBe(true);
  });
});

describe("RelationalStrategicIntelligenceEngineService", () => {
  const policy = new RelationalStrategicIntelligencePolicyService();
  const engine = new RelationalStrategicIntelligenceEngineService(
    policy,
    new RelationalStrategicIntelligencePriorityService(policy),
    new RelationalStrategicIntelligenceRiskService(policy),
    new RelationalStrategicIntelligenceBalanceService(),
  );

  it("computes bounded institutional scores", () => {
    const state = engine.computeStrategicIntelligenceState(baseCtx);
    expect(state.strategicIntelligenceScore).toBeLessThanOrEqual(100);
    expect(state.executiveExposure).toBeLessThanOrEqual(100);
    expect(state.systemicConcentration).toBeLessThanOrEqual(100);
    expect(state.strategicAlignmentScore).toBeLessThanOrEqual(100);
    expect(state.orchestrationPressure).toBeLessThanOrEqual(100);
  });

  it("detects executive pressure under coordination stress", () => {
    const stressed = { ...baseCtx, topInstitutionalExecutiveRisk: 80, governanceConflictCount: 4 };
    const state = engine.computeStrategicIntelligenceState(stressed);
    expect(state.executiveExposureDetected).toBe(true);
  });
});

describe("RelationalStrategicIntelligenceSynthesisService", () => {
  const policy = new RelationalStrategicIntelligencePolicyService();
  const synthesisSvc = new RelationalStrategicIntelligenceSynthesisService(
    policy,
    new RelationalStrategicIntelligencePriorityService(policy),
  );
  const engine = new RelationalStrategicIntelligenceEngineService(
    policy,
    new RelationalStrategicIntelligencePriorityService(policy),
    new RelationalStrategicIntelligenceRiskService(policy),
    new RelationalStrategicIntelligenceBalanceService(),
  );

  it("produces deterministic template briefs from scores", () => {
    const state = engine.computeStrategicIntelligenceState(baseCtx);
    const briefs = synthesisSvc.generateStrategicSyntheses(baseCtx, state);
    expect(briefs.length).toBe(7);
    expect(briefs[0]!.summary).toContain(String(state.strategicIntelligenceScore));
    expect(briefs[0]!.title.length).toBeGreaterThan(0);
    expect(briefs[0]!.institutionalPressure).toBeLessThanOrEqual(100);
  });
});
