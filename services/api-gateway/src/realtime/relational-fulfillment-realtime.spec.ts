import { describe, expect, it } from "vitest";
import {
  isRelationalFulfillmentRealtimeEventType,
  RelationalFulfillmentRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.9 — relational.fulfillment.* realtime whitelist", () => {
  it("rejects unknown subtype", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.unknown")).toBe(false);
  });

  it("accepts relational.fulfillment.completed", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.completed")).toBe(true);
  });

  it("accepts relational.fulfillment.proof_submitted", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.proof_submitted")).toBe(true);
  });

  it("accepts relational.fulfillment.reception_validated", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.reception_validated")).toBe(true);
  });

  it("accepts relational.fulfillment.incident_resolved", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.incident_resolved")).toBe(true);
  });

  it("accepts relational.fulfillment.reception_rejected", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.reception_rejected")).toBe(true);
  });

  it("schema enforces payment/public tracking literals", () => {
    const ok = RelationalFulfillmentRealtimeSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      fulfillmentStatus: "FULFILLMENT_COMPLETED",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });
});
