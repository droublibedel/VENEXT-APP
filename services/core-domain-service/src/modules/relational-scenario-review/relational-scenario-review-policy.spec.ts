import { describe, expect, it } from "vitest";

import { RelationalScenarioReviewPolicyService } from "./relational-scenario-review-policy.service";

describe("Instruction 20.17 — scenario review policy", () => {
  const policy = new RelationalScenarioReviewPolicyService();

  it("requires dual validation for collapse and governance simulations", () => {
    expect(policy.requiresDualValidation("COLLAPSE_PROPAGATION")).toBe(true);
    expect(policy.requiresDualValidation("GOVERNANCE_BREAKDOWN")).toBe(true);
    expect(policy.requiresDualValidation("SLA_STRESS_TEST")).toBe(false);
  });

  it("requires executive validation for critical corridor states", () => {
    expect(
      policy.requiresExecutiveValidation({
        decisionSeverity: "HIGH",
        corridorState: "SUSPENDED",
        resultingRiskScore: 50,
        collapseScore: 40,
        criticalSimulationCount: 0,
      }),
    ).toBe(true);
    expect(
      policy.requiresExecutiveValidation({
        decisionSeverity: "CRITICAL",
        corridorState: "ACTIVE",
        resultingRiskScore: 90,
        collapseScore: 40,
        criticalSimulationCount: 0,
      }),
    ).toBe(true);
  });

  it("blocks approval on terminal status and terminated corridor", () => {
    expect(() =>
      policy.assertCanApprove({
        reviewStatus: "APPROVED",
        corridorState: "ACTIVE",
        decisionSeverity: "MEDIUM",
        resultingRiskScore: 50,
        simulationType: null,
        simulationSeverity: null,
        requiresExecutiveValidation: false,
        requiresDualValidation: false,
        activeOrchestrationTypes: [],
        criticalSimulationCount: 0,
        collapseScore: 0,
        metadata: {},
      }),
    ).toThrow("scenario_review_terminal");

    expect(() =>
      policy.assertCanApprove({
        reviewStatus: "PENDING_REVIEW",
        corridorState: "TERMINATED",
        decisionSeverity: "MEDIUM",
        resultingRiskScore: 50,
        simulationType: null,
        simulationSeverity: null,
        requiresExecutiveValidation: false,
        requiresDualValidation: false,
        activeOrchestrationTypes: [],
        criticalSimulationCount: 0,
        collapseScore: 0,
        metadata: {},
      }),
    ).toThrow("scenario_review_corridor_terminated");
  });

  it("detects conflicting active orchestrations", () => {
    expect(
      policy.hasConflictingOrchestration(["COLLAPSE_PREVENTION", "CORRIDOR_RECOVERY"]),
    ).toBe(true);
    expect(policy.hasConflictingOrchestration(["SLA_STABILIZATION"])).toBe(false);
  });

  it("auto-creates reviews for critical simulations", () => {
    expect(
      policy.shouldAutoCreateReview({
        simulationType: "SLA_STRESS_TEST",
        severity: "CRITICAL",
        outcome: "STABLE",
        requiresHumanReview: false,
      }),
    ).toBe(true);
  });
});
