import { describe, expect, it } from "vitest";
import {
  isRelationalEconomicSignalRealtimeType,
  RelationalEconomicRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.19 — relational.economic.* realtime", () => {
  it("whitelist signal_created", () => {
    expect(isRelationalEconomicSignalRealtimeType("relational.economic.signal_created")).toBe(true);
  });

  it("whitelist signal_archived (20.19A)", () => {
    expect(isRelationalEconomicSignalRealtimeType("relational.economic.signal_archived")).toBe(true);
  });

  it("rejects strategic memory events", () => {
    expect(isRelationalEconomicSignalRealtimeType("relational.memory.created")).toBe(false);
  });

  it("accepts minimal archived payload with journal eventType", () => {
    const ok = RelationalEconomicRealtimeSchema.safeParse({
      nodeId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      eventType: "SIGNAL_ARCHIVED",
      propagationRisk: "MEDIUM",
      systemicExposureScore: 40,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects tracking fields", () => {
    const bad = RelationalEconomicRealtimeSchema.safeParse({
      nodeId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      propagationRisk: "HIGH",
      systemicExposureScore: 80,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      gpsCoordinates: "1,2",
    });
    expect(bad.success).toBe(false);
  });

  it("rejects wallet/payment fields on archived payload", () => {
    const bad = RelationalEconomicRealtimeSchema.safeParse({
      nodeId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      eventType: "SIGNAL_ARCHIVED",
      propagationRisk: "LOW",
      systemicExposureScore: 10,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletBalance: 100,
    });
    expect(bad.success).toBe(false);
  });
});
