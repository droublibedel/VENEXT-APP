import { describe, expect, it } from "vitest";

import {
  RECOMMENDATION_ENGINE_THRESHOLDS,
  RelationalOperationalRecommendationPolicyService,
} from "./relational-operational-recommendation-policy.service";

describe("Instruction 20.14 — operational recommendation policy", () => {
  const policy = new RelationalOperationalRecommendationPolicyService();

  it("maps score to severity bands", () => {
    expect(policy.severityFromScore(90)).toBe("CRITICAL");
    expect(policy.severityFromScore(70)).toBe("HIGH");
    expect(policy.severityFromScore(50)).toBe("MEDIUM");
    expect(policy.severityFromScore(10)).toBe("LOW");
  });

  it("enforces cooldown window", () => {
    const now = new Date("2026-05-15T12:00:00.000Z");
    const recent = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    expect(policy.isWithinCooldown(recent, now)).toBe(true);
    const old = new Date(now.getTime() - (RECOMMENDATION_ENGINE_THRESHOLDS.cooldownHours + 1) * 60 * 60 * 1000);
    expect(policy.isWithinCooldown(old, now)).toBe(false);
  });

  it("prioritizes CRITICAL before HIGH by severity then score", () => {
    const ordered = policy.prioritize([
      {
        code: "a",
        type: "SLA_DEGRADATION_RECOMMENDATION",
        source: "SLA_ANALYSIS",
        severity: "HIGH",
        title: "h",
        description: "d",
        score: 90,
        confidence: 80,
      },
      {
        code: "b",
        type: "COLLAPSE_PREVENTION_RECOMMENDATION",
        source: "CORRIDOR_COLLAPSE_ANALYSIS",
        severity: "CRITICAL",
        title: "c",
        description: "d",
        score: 50,
        confidence: 80,
      },
    ]);
    expect(ordered[0]?.severity).toBe("CRITICAL");
  });

  it("builds stable recommendation codes", () => {
    const id = "00000000-0000-4000-8000-000000000099";
    expect(policy.buildCode("OPERATIONAL_REVIEW_RECOMMENDATION", id)).toBe(
      "OPERATIONAL_REVIEW_RECOMMENDATION:00000000",
    );
  });
});
