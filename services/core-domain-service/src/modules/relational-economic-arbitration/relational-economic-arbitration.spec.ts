/**
 * Instruction 20.31 — arbitration engines (deterministic, non-autopilot).
 */
import { CommercialCorridorState, RelationalEconomicArbitrationScenarioType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { EconomicArbitrationCorridorContext } from "./relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicArbitrationConflictService } from "./relational-economic-arbitration-conflict.service";
import { RelationalEconomicArbitrationDecisionService } from "./relational-economic-arbitration-decision.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";
import { RelationalEconomicArbitrationPriorityService } from "./relational-economic-arbitration-priority.service";
import { RelationalEconomicArbitrationRiskService } from "./relational-economic-arbitration-risk.service";
import { RelationalEconomicArbitrationScenarioService } from "./relational-economic-arbitration-scenario.service";

const baseCtx: EconomicArbitrationCorridorContext = {
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
  governanceConflicts: [
    {
      id: "00000000-0000-4000-8000-0000000000c1",
      conflictCode: "GOV_CONFLICT:1:recovery",
      conflictType: "RECOVERY_CONFLICT",
      conflictPressure: 62,
      systemicExposure: 55,
      recoveryImpact: 70,
      estimatedResolutionComplexity: 65,
      severity: "HIGH",
      priority: "HIGH",
    },
  ],
};

describe("RelationalEconomicArbitrationPolicyService", () => {
  const policy = new RelationalEconomicArbitrationPolicyService();

  it("assertEconomicArbitrationMutationAllowed blocks TERMINATED", () => {
    const t = policy.assertEconomicArbitrationMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(t.allowed).toBe(false);
    expect(t.diagnostics.arbitrationMutationRejected).toBe(true);
  });

  it("requires dual validation for systemic containment scenarios", () => {
    expect(policy.requiresDualValidation(RelationalEconomicArbitrationScenarioType.SYSTEMIC_CONTAINMENT)).toBe(
      true,
    );
    expect(policy.requiresDualValidation(RelationalEconomicArbitrationScenarioType.MINIMAL_INTERVENTION)).toBe(
      false,
    );
  });
});

describe("RelationalEconomicArbitrationConflictService", () => {
  const svc = new RelationalEconomicArbitrationConflictService(
    new RelationalEconomicArbitrationPolicyService(),
    new RelationalEconomicArbitrationPriorityService(new RelationalEconomicArbitrationPolicyService()),
    new RelationalEconomicArbitrationRiskService(new RelationalEconomicArbitrationPolicyService()),
  );

  it("detects arbitration candidates from governance conflicts", () => {
    const candidates = svc.detectArbitrationCandidates(baseCtx);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]!.arbitrationScore).toBeLessThanOrEqual(100);
    expect(candidates[0]!.resolutionProbability).toBeGreaterThanOrEqual(0.05);
  });
});

describe("RelationalEconomicArbitrationScenarioService", () => {
  it("generates 10 deterministic scenarios", () => {
    const conflictSvc = new RelationalEconomicArbitrationConflictService(
      new RelationalEconomicArbitrationPolicyService(),
      new RelationalEconomicArbitrationPriorityService(new RelationalEconomicArbitrationPolicyService()),
      new RelationalEconomicArbitrationRiskService(new RelationalEconomicArbitrationPolicyService()),
    );
    const scenarioSvc = new RelationalEconomicArbitrationScenarioService(new RelationalEconomicArbitrationPolicyService());
    const candidate = conflictSvc.detectArbitrationCandidates(baseCtx)[0]!;
    const scenarios = scenarioSvc.generateScenarios(
      baseCtx.relationshipId,
      "ARB_CASE:preview",
      candidate,
      baseCtx,
    );
    expect(scenarios).toHaveLength(10);
    expect(scenarios[0]!.scenarioType).toBe("STABILIZATION_FIRST");
  });
});

describe("RelationalEconomicArbitrationDecisionService", () => {
  it("compareScenarios picks highest recovery gain", () => {
    const svc = new RelationalEconomicArbitrationDecisionService({} as never, new RelationalEconomicArbitrationPolicyService());
    const best = svc.compareScenarios([
      {
        scenarioCode: "a",
        scenarioType: RelationalEconomicArbitrationScenarioType.MINIMAL_INTERVENTION,
        priority: "LOW",
        estimatedImpact: 40,
        estimatedRisk: 30,
        estimatedRecoveryGain: 45,
        dependencyImpact: 10,
        propagationImpact: 10,
        continuityImpact: 10,
        sovereigntyImpact: 10,
        confidenceLevel: "MEDIUM",
      },
      {
        scenarioCode: "b",
        scenarioType: RelationalEconomicArbitrationScenarioType.BALANCED_RECOVERY,
        priority: "HIGH",
        estimatedImpact: 60,
        estimatedRisk: 40,
        estimatedRecoveryGain: 72,
        dependencyImpact: 20,
        propagationImpact: 20,
        continuityImpact: 20,
        sovereigntyImpact: 20,
        confidenceLevel: "HIGH",
      },
    ]);
    expect(best?.scenarioCode).toBe("b");
  });
});
