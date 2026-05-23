import { describe, expect, it } from "vitest";
import {
  isRelationalFulfillmentTaskRealtimeEventType,
  RelationalFulfillmentTaskActionResponseSchema,
  RelationalFulfillmentTaskRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.11 — task realtime contracts", () => {
  it("whitelist includes task_created", () => {
    expect(isRelationalFulfillmentTaskRealtimeEventType("relational.fulfillment.task_created")).toBe(true);
  });

  it("rejects description in realtime payload", () => {
    const bad = RelationalFulfillmentTaskRealtimeSchema.safeParse({
      taskId: "00000000-0000-4000-8000-000000000001",
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      orderId: "00000000-0000-4000-8000-000000000004",
      taskStatus: "OPEN",
      taskType: "RECEPTION_COORDINATION",
      priority: "NORMAL",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      description: "long operational note",
    });
    expect(bad.success).toBe(false);
  });

  it("action response requires payment literal", () => {
    const bad = RelationalFulfillmentTaskActionResponseSchema.safeParse({
      taskId: "00000000-0000-4000-8000-000000000001",
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000002",
      orderId: "00000000-0000-4000-8000-000000000004",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      previousStatus: null,
      nextStatus: "OPEN",
      actionType: "TASK_CREATED",
      eventCreated: true,
      eventType: "TASK_CREATED",
      publicTrackingDisabled: true,
    });
    expect(bad.success).toBe(false);
  });
});
