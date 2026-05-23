/**
 * Instruction 20.33 — monitoring engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { EconomicMonitoringCorridorContext } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringAlertService } from "./relational-economic-monitoring-alert.service";
import { RelationalEconomicMonitoringBalanceService } from "./relational-economic-monitoring-balance.service";
import { RelationalEconomicMonitoringEngineService } from "./relational-economic-monitoring-engine.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";
import { RelationalEconomicMonitoringPriorityService } from "./relational-economic-monitoring-priority.service";
import { RelationalEconomicMonitoringRiskService } from "./relational-economic-monitoring-risk.service";

const baseCtx: EconomicMonitoringCorridorContext = {
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
};

describe("RelationalEconomicMonitoringPolicyService", () => {
  const policy = new RelationalEconomicMonitoringPolicyService();

  it("blocks TERMINATED corridor mutations", () => {
    const gate = policy.assertEconomicMonitoringMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(gate.allowed).toBe(false);
    expect(gate.diagnostics.monitoringMutationRejected).toBe(true);
  });
});

describe("RelationalEconomicMonitoringEngineService", () => {
  const engine = new RelationalEconomicMonitoringEngineService(
    new RelationalEconomicMonitoringPolicyService(),
    new RelationalEconomicMonitoringPriorityService(new RelationalEconomicMonitoringPolicyService()),
    new RelationalEconomicMonitoringRiskService(new RelationalEconomicMonitoringPolicyService()),
    new RelationalEconomicMonitoringBalanceService(),
  );

  it("computes bounded monitoring scores", () => {
    const state = engine.computeMonitoringState(baseCtx);
    expect(state.monitoringScore).toBeLessThanOrEqual(100);
    expect(state.executivePressure).toBeLessThanOrEqual(100);
    expect(state.systemicRisk).toBeLessThanOrEqual(100);
  });

  it("detects systemic escalation under fragility", () => {
    const state = engine.computeMonitoringState({ ...baseCtx, macroStructuralFragility: 75, openIncidentCount: 3 });
    expect(state.systemicEscalationDetected).toBe(true);
  });
});

describe("RelationalEconomicMonitoringAlertService", () => {
  const alertSvc = new RelationalEconomicMonitoringAlertService(
    new RelationalEconomicMonitoringPolicyService(),
    new RelationalEconomicMonitoringPriorityService(new RelationalEconomicMonitoringPolicyService()),
  );
  const engine = new RelationalEconomicMonitoringEngineService(
    new RelationalEconomicMonitoringPolicyService(),
    new RelationalEconomicMonitoringPriorityService(new RelationalEconomicMonitoringPolicyService()),
    new RelationalEconomicMonitoringRiskService(new RelationalEconomicMonitoringPolicyService()),
    new RelationalEconomicMonitoringBalanceService(),
  );

  it("detects executive and systemic alerts", () => {
    const highCtx = { ...baseCtx, topInstabilityPressure: 70, macroStructuralFragility: 75, openIncidentCount: 3 };
    const state = engine.computeMonitoringState(highCtx);
    const alerts = alertSvc.detectCriticalAlerts(highCtx, state);
    expect(alerts.length).toBeGreaterThan(0);
    expect(
      alerts.some(
        (a) =>
          a.alertType === "EXECUTIVE_PRESSURE" ||
          a.alertType === "SYSTEMIC_ESCALATION" ||
          a.alertType === "STABILIZATION_FAILURE",
      ),
    ).toBe(true);
  });
});
