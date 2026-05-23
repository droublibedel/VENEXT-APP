import { describe, expect, it } from "vitest";

import { RelationalStrategicMemoryPolicyService } from "./relational-strategic-memory-policy.service";

describe("Instruction 20.18 — strategic memory policy", () => {
  const policy = new RelationalStrategicMemoryPolicyService();

  it("blocks reuse on invalidated memory and terminated corridor", () => {
    expect(() =>
      policy.assertCanReuse({
        memoryStatus: "INVALIDATED",
        corridorState: "ACTIVE",
        confidenceLevel: 80,
        failedReuseCount: 0,
        reuseCount: 1,
        hasCoherentSource: true,
        observedPattern: "pattern",
      }),
    ).toThrow("strategic_memory_invalidated");

    expect(() =>
      policy.assertCanReuse({
        memoryStatus: "ACTIVE",
        corridorState: "TERMINATED",
        confidenceLevel: 80,
        failedReuseCount: 0,
        reuseCount: 1,
        hasCoherentSource: true,
        observedPattern: "pattern",
      }),
    ).toThrow("strategic_memory_corridor_terminated");
  });

  it("evolves confidence on outcome assessment", () => {
    expect(policy.evolveConfidence(70, true)).toBe(75);
    expect(policy.evolveConfidence(70, false)).toBe(58);
  });

  it("detects recurring operational patterns deterministically", () => {
    const patterns = policy.detectRecurringPatterns({
      openIncidents: 3,
      slaAlerts: 2,
      completedOrchestrations: 2,
      approvedReviews: 2,
      collapseRecoveries: 1,
    });
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some((p) => p.patternCode === "RECURRING_INCIDENTS")).toBe(true);
  });

  it("blocks memory activation on terminated corridor", () => {
    expect(
      policy.canActivateMemory({
        memoryStatus: "ACTIVE",
        corridorState: "TERMINATED",
        confidenceLevel: 80,
        failedReuseCount: 0,
        reuseCount: 0,
        hasCoherentSource: true,
        observedPattern: "x",
      }),
    ).toBe(false);
  });
});
