import { describe, expect, it } from "vitest";

import { RelationalPredictiveRiskPolicyService } from "./relational-predictive-risk-policy.service";

describe("Instruction 20.13 — predictive risk policy", () => {
  const p = new RelationalPredictiveRiskPolicyService();

  it("allows historical observation on BLOCKED, DEGRADED, TERMINATED", () => {
    expect(p.allowsHistoricalCorridorObservation("BLOCKED")).toBe(true);
    expect(p.allowsHistoricalCorridorObservation("DEGRADED")).toBe(true);
    expect(p.allowsHistoricalCorridorObservation("TERMINATED")).toBe(true);
  });

  it("computes deterministic score bounded 0-100", () => {
    const { score } = p.computeDeterministicScore({
      openIncidents: 2,
      blockingTasks: 2,
      criticalAlerts: 1,
      highAlerts: 2,
      avgFulfillmentHours: 80,
      corridorHealthScore: 40,
      driftCount: 2,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("maps score to risk level", () => {
    expect(p.levelFromScore(85)).toBe("CRITICAL");
    expect(p.levelFromScore(65)).toBe("HIGH");
    expect(p.levelFromScore(40)).toBe("MEDIUM");
    expect(p.levelFromScore(10)).toBe("LOW");
  });

  it("deviation percent is explainable", () => {
    expect(p.deviationPercent(10, 15)).toBe(50);
    expect(p.deviationPercent(0, 5)).toBe(100);
  });
});
