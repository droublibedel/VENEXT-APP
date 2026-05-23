import { describe, expect, it } from "vitest";

import { detectOptionalDependencyStatus } from "./relationship-governance-optional-deps";

describe("Instruction 20.4B — detectOptionalDependencyStatus", () => {
  it("lists missing negotiation policy when absent", () => {
    const d = detectOptionalDependencyStatus({
      negotiationCorridorPolicyMissing: true,
    });
    expect(d.optionalDependencyMissing).toContain("RelationshipGovernancePolicyService@negotiation_engine");
    expect(d.dependencyStatus.corridorPolicyNegotiationEngine).toBe("MISSING");
  });

  it("is never an empty placeholder surface — arrays and dependencyStatus populated", () => {
    const d = detectOptionalDependencyStatus({});
    expect(Array.isArray(d.optionalDependencyMissing)).toBe(true);
    expect(Array.isArray(d.optionalDependencyWarnings)).toBe(true);
    expect(Object.keys(d.dependencyStatus).length).toBeGreaterThan(0);
    expect(d.orderCreationDirectCallSites).toBe("NOT_PRESENT_IN_CODEBASE");
    expect(d.orderCreationPolicyWired).toBe(false);
    expect(d.cartConversionPolicyWired).toBe(true);
  });
});
