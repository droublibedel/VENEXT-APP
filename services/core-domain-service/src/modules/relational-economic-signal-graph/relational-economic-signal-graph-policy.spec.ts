import { describe, expect, it } from "vitest";

import { RelationalEconomicSignalPolicyService } from "./relational-economic-signal-policy.service";

describe("Instruction 20.19 — economic signal graph policy", () => {
  const policy = new RelationalEconomicSignalPolicyService();

  it("computes bounded cascade exposure", () => {
    expect(policy.boundedCascadeExposure(2, 80)).toBeLessThanOrEqual(100);
    expect(policy.boundedCascadeExposure(10, 80)).toBeLessThan(80);
  });

  it("maps correlation strength deterministically", () => {
    expect(policy.correlationStrengthFromScore(85)).toBe("CRITICAL");
    expect(policy.correlationStrengthFromScore(20)).toBe("WEAK");
  });

  it("blocks graph mutation on TERMINATED corridor", () => {
    expect(policy.canMutateGraph("TERMINATED")).toBe(false);
    expect(policy.canMutateGraph("ACTIVE")).toBe(true);
  });

  it("detects severity from stress score", () => {
    expect(policy.severityFromScore(90)).toBe("CRITICAL");
    expect(policy.severityFromScore(10)).toBe("LOW");
  });

  it("increases stress score when openTasks rise", () => {
    const base = {
      openIncidents: 0,
      slaAlerts: 0,
      criticalSimulations: 0,
      activeOrchestrations: 0,
      activeRecommendations: 0,
      activeMemories: 0,
      openTasks: 0,
      openTasksComputed: true as const,
      openTasksSource: "RELATIONAL_FULFILLMENT_TASK" as const,
      openTasksIncludedStatuses: ["OPEN"],
      openTasksExcludedStatuses: ["COMPLETED"],
    };
    const withoutTasks = policy.computeStressScore(base);
    const withTasks = policy.computeStressScore({ ...base, openTasks: 5 });
    expect(withTasks).toBeGreaterThan(withoutTasks);
  });
});
