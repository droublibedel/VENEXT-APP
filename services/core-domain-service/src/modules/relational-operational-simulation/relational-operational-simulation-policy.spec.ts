import { describe, expect, it } from "vitest";

import { RelationalOperationalSimulationPolicyService } from "./relational-operational-simulation-policy.service";

describe("Instruction 20.16 — operational simulation policy", () => {
  const policy = new RelationalOperationalSimulationPolicyService();

  const baseInputs = {
    openAlerts: 2,
    criticalAlerts: 1,
    openIncidents: 1,
    openTasks: 3,
    openRecommendations: 1,
    openOrchestrations: 1,
    corridorHealthScore: 65,
    corridorState: "ACTIVE",
    predictiveSignals: 1,
    stressMultiplier: 1,
  };

  it("requires human review for collapse and governance simulations", () => {
    expect(policy.requiresHumanReview("COLLAPSE_PROPAGATION")).toBe(true);
    expect(policy.requiresHumanReview("MULTI_CORRIDOR_STRESS")).toBe(true);
    expect(policy.requiresHumanReview("SLA_STRESS_TEST")).toBe(false);
  });

  it("computes deterministic risk score", () => {
    const score = policy.computeRiskScore(baseInputs);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("projects collapse propagation metrics", () => {
    const p = policy.projectCollapsePropagation(baseInputs);
    expect(p.operationalFragility).toBeGreaterThan(0);
    expect(p.collapsePropagationRisk).toBeGreaterThan(0);
    expect(p.stabilizationProbability).toBeLessThanOrEqual(100);
    expect(p.recoveryComplexity).toBeLessThanOrEqual(100);
  });

  it("maps score to outcomes", () => {
    expect(policy.outcomeFromScore(95)).toBe("COLLAPSE_RISK");
    expect(policy.outcomeFromScore(10)).toBe("STABLE");
  });

  it("generates ordered scenarios per type", () => {
    const scenarios = policy.scenarioTemplatesFor("SLA_STRESS_TEST");
    expect(scenarios.length).toBeGreaterThan(1);
    expect(scenarios[0]!.scenarioOrder).toBeLessThan(scenarios[1]!.scenarioOrder);
  });
});
