import { describe, expect, it } from "vitest";
import {
  isRelationalFulfillmentRealtimeEventType,
  RelationalFulfillmentActionResponseSchema,
  RelationalFulfillmentRealtimeSchema,
} from "@venext/shared-contracts";

import { incidentBlocksCompletion } from "./relational-fulfillment-incident.mapper";

describe("Instruction 20.10 — incident resolution", () => {
  it("OPEN blocking incident blocks completion", () => {
    expect(
      incidentBlocksCompletion({
        incidentType: "DOCUMENT_MISMATCH",
        resolutionStatus: "OPEN",
        metadata: { blocksFulfillmentCompletion: true },
      }),
    ).toBe(true);
  });

  it("RESOLVED blocking incident does not block completion", () => {
    expect(
      incidentBlocksCompletion({
        incidentType: "DOCUMENT_MISMATCH",
        resolutionStatus: "RESOLVED",
        metadata: { blocksFulfillmentCompletion: true },
      }),
    ).toBe(false);
  });

  it("non-blocking PACKAGING_ISSUE OPEN does not block via type alone", () => {
    expect(
      incidentBlocksCompletion({
        incidentType: "PACKAGING_ISSUE",
        resolutionStatus: "OPEN",
        metadata: { blocksFulfillmentCompletion: false },
      }),
    ).toBe(false);
  });

  it("realtime whitelist includes incident_resolution_proposed", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.incident_resolution_proposed")).toBe(
      true,
    );
  });

  it("realtime schema rejects incident description field", () => {
    const bad = RelationalFulfillmentRealtimeSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      fulfillmentStatus: "INCIDENT_REPORTED",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      description: "full incident text",
    });
    expect(bad.success).toBe(false);
  });

  it("action response accepts RECEPTION_REJECTED action type", () => {
    const ok = RelationalFulfillmentActionResponseSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      previousStatus: "ARRIVED_AT_DESTINATION",
      nextStatus: "RECEPTION_REJECTED",
      actionType: "RECEPTION_REJECTED",
      eventCreated: true,
      eventType: "RECEPTION_REJECTED",
      incidentId: "00000000-0000-4000-8000-000000000004",
      resolutionStatus: "OPEN",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });
});
