import { describe, expect, it } from "vitest";
import {
  isRelationalOperationalRealtimeEventType,
  RelationalOperationalRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.12 — relational.operational.* realtime", () => {
  it("whitelist corridor_risk_detected", () => {
    expect(isRelationalOperationalRealtimeEventType("relational.operational.corridor_risk_detected")).toBe(true);
  });

  it("rejects fileUrl in payload", () => {
    const bad = RelationalOperationalRealtimeSchema.safeParse({
      alertId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      severity: "HIGH",
      alertType: "CORRIDOR_OPERATIONAL_DEGRADATION",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      fileUrl: "https://evil.example/x",
    });
    expect(bad.success).toBe(false);
  });
});
