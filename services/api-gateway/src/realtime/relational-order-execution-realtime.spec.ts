import { describe, expect, it } from "vitest";
import {
  isRelationalOrderExecutionRealtimeEventType,
  RelationalOrderExecutionRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.8 — relational.order.* realtime whitelist", () => {
  it("rejects unknown relational.order subtype", () => {
    expect(isRelationalOrderExecutionRealtimeEventType("relational.order.unknown_custom")).toBe(false);
  });

  it("accepts relational.order.cancelled", () => {
    expect(isRelationalOrderExecutionRealtimeEventType("relational.order.cancelled")).toBe(true);
  });

  it("RelationalOrderExecutionRealtimeSchema rejects missing literals", () => {
    const r = RelationalOrderExecutionRealtimeSchema.safeParse({
      orderId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      executionStatus: "DISPATCHED",
      eventType: "DISPATCH_CONFIRMED",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(r.success).toBe(false);
  });
});
