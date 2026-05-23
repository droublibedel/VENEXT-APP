import { describe, expect, it } from "vitest";

import {
  ORCHESTRATION_ENGINE_THRESHOLDS,
  RelationalOperationalOrchestrationPolicyService,
} from "./relational-operational-orchestration-policy.service";

describe("Instruction 20.15 — operational orchestration policy", () => {
  const policy = new RelationalOperationalOrchestrationPolicyService();

  it("requires human validation for critical orchestration types", () => {
    expect(policy.requiresHumanValidation("COLLAPSE_PREVENTION")).toBe(true);
    expect(policy.requiresHumanValidation("GOVERNANCE_REVIEW")).toBe(true);
    expect(policy.requiresHumanValidation("CORRIDOR_RECOVERY")).toBe(true);
    expect(policy.requiresHumanValidation("SLA_STABILIZATION")).toBe(false);
  });

  it("orders steps with increasing stepOrder", () => {
    const steps = policy.stepTemplatesFor("INCIDENT_CONTAINMENT");
    expect(steps[0]?.stepOrder).toBe(1);
    expect(steps[steps.length - 1]?.stepOrder).toBeGreaterThan(1);
  });

  it("detects conflicting active orchestration types", () => {
    expect(policy.hasConflictingActive("COLLAPSE_PREVENTION", ["CORRIDOR_RECOVERY"])).toBe(true);
    expect(policy.hasConflictingActive("SLA_STABILIZATION", ["INCIDENT_CONTAINMENT"])).toBe(false);
  });

  it("enforces cooldown window", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const recent = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    expect(policy.isWithinCooldown(recent, now)).toBe(true);
    const old = new Date(now.getTime() - (ORCHESTRATION_ENGINE_THRESHOLDS.cooldownHours + 1) * 60 * 60 * 1000);
    expect(policy.isWithinCooldown(old, now)).toBe(false);
  });

  it("maps recommendation types to orchestration types", () => {
    expect(policy.mapRecommendationType("COLLAPSE_PREVENTION_RECOMMENDATION")).toBe("COLLAPSE_PREVENTION");
    expect(policy.mapRecommendationType("DOCUMENT_VALIDATION_RECOMMENDATION")).toBe("DOCUMENT_REINFORCEMENT");
  });
});
