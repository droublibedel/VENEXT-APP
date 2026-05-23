import { describe, expect, it } from "vitest";
import { RelationalFulfillmentActionResponseSchema } from "@venext/shared-contracts";

import { nextGenericFulfillmentStatus } from "./relational-fulfillment-actions-api";

describe("relational-fulfillment actions api", () => {
  it("nextGenericFulfillmentStatus advances linear corridor steps", () => {
    expect(nextGenericFulfillmentStatus("LOADING_CONFIRMED")).toBe("IN_TRANSFER");
    expect(nextGenericFulfillmentStatus("RECEPTION_VALIDATED")).toBeNull();
  });

  it("action response schema requires paymentExecutionDisabled literal", () => {
    const bad = RelationalFulfillmentActionResponseSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      previousStatus: "IN_TRANSFER",
      nextStatus: "ARRIVED_AT_DESTINATION",
      actionType: "TRANSITION",
      eventCreated: true,
      eventType: "FULFILLMENT_TRANSITIONED",
      publicTrackingDisabled: true,
    });
    expect(bad.success).toBe(false);
  });
});
