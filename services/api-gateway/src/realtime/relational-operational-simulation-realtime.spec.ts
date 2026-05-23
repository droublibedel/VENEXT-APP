import { describe, expect, it } from "vitest";
import {
  isRelationalOperationalSimulationRealtimeEventType,
  RelationalOperationalSimulationRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.16 — relational.operational.simulation_* realtime", () => {
  it("whitelist simulation_started", () => {
    expect(isRelationalOperationalSimulationRealtimeEventType("relational.operational.simulation_started")).toBe(
      true,
    );
  });

  it("rejects orchestration events", () => {
    expect(isRelationalOperationalSimulationRealtimeEventType("relational.operational.orchestration_created")).toBe(
      false,
    );
  });

  it("rejects payment fields", () => {
    const bad = RelationalOperationalSimulationRealtimeSchema.safeParse({
      simulationId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      simulationType: "SLA_STRESS_TEST",
      severity: "MEDIUM",
      outcome: "STABLE",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      paymentId: "pay-1",
    });
    expect(bad.success).toBe(false);
  });
});
