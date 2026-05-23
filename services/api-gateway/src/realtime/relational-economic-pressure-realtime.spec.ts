import { describe, expect, it } from "vitest";
import {
  isRelationalEconomicPressureRealtimeEventType,
  PressureRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.21 — relational.pressure.* realtime", () => {
  it("whitelist pressure_detected", () => {
    expect(isRelationalEconomicPressureRealtimeEventType("relational.pressure.pressure_detected")).toBe(true);
  });

  it("rejects relational.command events", () => {
    expect(isRelationalEconomicPressureRealtimeEventType("relational.command.snapshot_created")).toBe(false);
  });

  it("accepts minimal payload", () => {
    const ok = PressureRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      edgeId: null,
      severity: "HIGH",
      systemicPressure: 72,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects forbidden tracking / wallet fields", () => {
    const bad = PressureRealtimeSchema.safeParse({
      relationshipId: null,
      edgeId: null,
      severity: "LOW",
      systemicPressure: 10,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletId: "x",
      gpsLat: 1,
    });
    expect(bad.success).toBe(false);
  });
});
