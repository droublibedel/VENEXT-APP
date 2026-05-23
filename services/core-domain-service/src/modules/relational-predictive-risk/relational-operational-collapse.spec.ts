import { describe, expect, it } from "vitest";

import { RelationalPredictiveRiskPolicyService } from "./relational-predictive-risk-policy.service";
import { RelationalOperationalCollapseService } from "./relational-operational-collapse.service";

describe("Instruction 20.13 — collapse detection (unit)", () => {
  const policy = new RelationalPredictiveRiskPolicyService();

  it("collapse service highestOpenRiskLevel orders CRITICAL first", () => {
    const collapse = new RelationalOperationalCollapseService({} as never, policy);
    expect(collapse.highestOpenRiskLevel(["LOW", "HIGH", "CRITICAL"])).toBe("CRITICAL");
    expect(collapse.highestOpenRiskLevel(["MEDIUM", "LOW"])).toBe("MEDIUM");
    expect(collapse.highestOpenRiskLevel([])).toBeNull();
  });
});
