import { describe, expect, it } from "vitest";

import { RelationalOperationalIntelligencePolicyService } from "./relational-operational-intelligence-policy.service";

describe("Instruction 20.12 — operational intelligence policy", () => {
  const p = new RelationalOperationalIntelligencePolicyService();

  it("allows historical observation on BLOCKED, DEGRADED, TERMINATED corridors", () => {
    expect(p.allowsHistoricalCorridorObservation("BLOCKED")).toBe(true);
    expect(p.allowsHistoricalCorridorObservation("DEGRADED")).toBe(true);
    expect(p.allowsHistoricalCorridorObservation("TERMINATED")).toBe(true);
  });

  it("computes CRITICAL health when critical alerts present", () => {
    expect(
      p.computeCorridorOperationalHealth({
        corridorState: "ACTIVE",
        corridorHealthScore: 80,
        openAlerts: 1,
        criticalAlerts: 1,
      }),
    ).toBe("CRITICAL");
  });

  it("computes DEGRADED health for DEGRADED corridor state", () => {
    expect(
      p.computeCorridorOperationalHealth({
        corridorState: "DEGRADED",
        corridorHealthScore: 70,
        openAlerts: 0,
        criticalAlerts: 0,
      }),
    ).toBe("DEGRADED");
  });

  it("measures hours between timestamps", () => {
    const a = new Date("2026-01-01T00:00:00.000Z");
    const b = new Date("2026-01-02T12:00:00.000Z");
    expect(p.hoursBetween(a, b)).toBe(36);
  });
});
