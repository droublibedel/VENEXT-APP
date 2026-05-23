import { describe, expect, it } from "vitest";
import {
  isRelationalFulfillmentTaskRealtimeEventType,
  RelationalFulfillmentTaskRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.11 — relational.fulfillment.task_* realtime", () => {
  it("whitelist task_completed", () => {
    expect(isRelationalFulfillmentTaskRealtimeEventType("relational.fulfillment.task_completed")).toBe(true);
  });

  it("rejects fileUrl in payload", () => {
    const bad = RelationalFulfillmentTaskRealtimeSchema.safeParse({
      taskId: "00000000-0000-4000-8000-000000000001",
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      orderId: "00000000-0000-4000-8000-000000000004",
      taskStatus: "OPEN",
      taskType: "RECEPTION_COORDINATION",
      priority: "HIGH",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      fileUrl: "https://evil.example/x",
    });
    expect(bad.success).toBe(false);
  });
});
