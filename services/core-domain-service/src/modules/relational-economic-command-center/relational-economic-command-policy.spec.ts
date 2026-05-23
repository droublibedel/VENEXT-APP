import { describe, expect, it } from "vitest";

import { RelationalEconomicCommandPolicyService } from "./relational-economic-command-policy.service";

describe("Instruction 20.20 — command center policy & bounded aggregation helpers", () => {
  const p = new RelationalEconomicCommandPolicyService();

  it("clamps scores to 0..100 integers", () => {
    expect(p.clampInt(-5)).toBe(0);
    expect(p.clampInt(444)).toBe(100);
    expect(p.clampInt(33.7)).toBe(34);
  });

  it("maps severities deterministically", () => {
    expect(p.severityFromRiskScore(20)).toBe("LOW");
    expect(p.severityFromRiskScore(50)).toBe("MEDIUM");
    expect(p.severityFromRiskScore(72)).toBe("HIGH");
    expect(p.severityFromRiskScore(90)).toBe("CRITICAL");
  });

  it("forbids snapshot mutation on TERMINATED corridors only", () => {
    expect(p.canMutateCommandSnapshot("ACTIVE")).toBe(true);
    expect(p.canMutateCommandSnapshot("TERMINATED")).toBe(false);
  });

  it("computes propagation pressure complement as health score", () => {
    expect(p.healthFromStress(30)).toBe(70);
    expect(p.healthFromStress(200)).toBe(0);
  });

  it("anchors control priorities from aggregated risk scores", () => {
    expect(p.controlPriorityFromRisk(10)).toBe("LOW");
    expect(p.controlPriorityFromRisk(50)).toBe("NORMAL");
    expect(p.controlPriorityFromRisk(75)).toBe("HIGH");
    expect(p.controlPriorityFromRisk(92)).toBe("CRITICAL");
  });
});
