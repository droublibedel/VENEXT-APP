import { describe, expect, it } from "vitest";
import {
  isRelationalEconomicCommandCenterRealtimeType,
  RelationalEconomicCommandCenterRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.20 — relational.command.* realtime", () => {
  it("whitelist snapshot_created", () => {
    expect(isRelationalEconomicCommandCenterRealtimeType("relational.command.snapshot_created")).toBe(true);
  });

  it("rejects relational.economic events", () => {
    expect(isRelationalEconomicCommandCenterRealtimeType("relational.economic.signal_created")).toBe(false);
  });

  it("accepts minimal payload", () => {
    const ok = RelationalEconomicCommandCenterRealtimeSchema.safeParse({
      snapshotId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      severity: "HIGH",
      globalRiskScore: 72,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects wallet / gps / payment-like fields", () => {
    const bad = RelationalEconomicCommandCenterRealtimeSchema.safeParse({
      snapshotId: "00000000-0000-4000-8000-000000000001",
      relationshipId: null,
      severity: "LOW",
      globalRiskScore: 12,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletLedgerId: "x",
      gpsCoordinates: "1,2",
    });
    expect(bad.success).toBe(false);
  });
});
