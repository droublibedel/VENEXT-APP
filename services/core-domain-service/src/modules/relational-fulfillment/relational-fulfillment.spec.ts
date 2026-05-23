import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import {
  isRelationalFulfillmentRealtimeEventType,
  RelationalFulfillmentActionResponseSchema,
  RelationalFulfillmentRealtimeSchema,
} from "@venext/shared-contracts";

import { RelationalFulfillmentPolicyService } from "./relational-fulfillment-policy.service";
import { incidentSeverityClass } from "./relational-fulfillment.types";

describe("Instruction 20.9A — relational fulfillment policy", () => {
  const p = new RelationalFulfillmentPolicyService();

  it("blocks generic transition to RECEPTION_VALIDATED", () => {
    expect(() => p.assertGenericTransitionTargetAllowed("RECEPTION_VALIDATED")).toThrow(BadRequestException);
    try {
      p.assertGenericTransitionTargetAllowed("RECEPTION_VALIDATED");
    } catch (e) {
      const err = e as BadRequestException;
      const res = err.getResponse() as Record<string, unknown>;
      expect(res.code).toBe("fulfillment_sensitive_transition_requires_domain_endpoint");
      expect(res.sensitiveTransitionBlocked).toBe(true);
      expect(res.attemptedTargetStatus).toBe("RECEPTION_VALIDATED");
    }
  });

  it("blocks generic transition to FULFILLMENT_COMPLETED", () => {
    expect(() => p.assertGenericTransitionTargetAllowed("FULFILLMENT_COMPLETED")).toThrow(BadRequestException);
  });

  it("blocks generic transition to RECEPTION_REJECTED", () => {
    expect(() => p.assertGenericTransitionTargetAllowed("RECEPTION_REJECTED")).toThrow(BadRequestException);
  });

  it("blocks generic transition to RECEPTION_PARTIALLY_VALIDATED", () => {
    expect(() => p.assertGenericTransitionTargetAllowed("RECEPTION_PARTIALLY_VALIDATED")).toThrow(BadRequestException);
  });

  it("allows LOADING_CONFIRMED -> IN_TRANSFER via generic policy", () => {
    expect(() => p.assertTransitionAllowed("LOADING_CONFIRMED", "IN_TRANSFER")).not.toThrow();
  });

  it("forbids PREPARING_FULFILLMENT -> RECEPTION_VALIDATED (skip arrival)", () => {
    expect(() => p.assertTransitionAllowed("PREPARING_FULFILLMENT", "RECEPTION_VALIDATED")).toThrow(BadRequestException);
  });

  it("canValidateReception only after arrival phases", () => {
    expect(p.canValidateReception("ARRIVED_AT_DESTINATION")).toBe(true);
    expect(p.canValidateReception("PREPARING_FULFILLMENT")).toBe(false);
  });
});

describe("Instruction 20.9A — incident blocking classification", () => {
  it("classifies blocking incident types", () => {
    expect(incidentSeverityClass("UNAUTHORIZED_SUBSTITUTION")).toBe("BLOCKING");
    expect(incidentSeverityClass("DOCUMENT_MISMATCH")).toBe("BLOCKING");
    expect(incidentSeverityClass("QUANTITY_MISMATCH")).toBe("BLOCKING");
  });

  it("classifies non-blocking incident types", () => {
    expect(incidentSeverityClass("FULFILLMENT_DELAY")).toBe("NON_BLOCKING");
    expect(incidentSeverityClass("PACKAGING_ISSUE")).toBe("NON_BLOCKING");
  });
});

describe("Instruction 20.9A — fulfillment realtime contracts", () => {
  it("accepts relational.fulfillment.proof_submitted whitelist", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.proof_submitted")).toBe(true);
  });

  it("accepts relational.fulfillment.reception_validated whitelist", () => {
    expect(isRelationalFulfillmentRealtimeEventType("relational.fulfillment.reception_validated")).toBe(true);
  });

  it("RelationalFulfillmentRealtimeSchema rejects GPS fields", () => {
    const bad = RelationalFulfillmentRealtimeSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      fulfillmentStatus: "IN_TRANSFER",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      latitude: 1,
    });
    expect(bad.success).toBe(false);
  });

  it("realtime schema rejects fileUrl in payload", () => {
    const bad = RelationalFulfillmentRealtimeSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      fulfillmentStatus: "RECEPTION_VALIDATED",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      fileUrl: "https://evil.example/proof.pdf",
    });
    expect(bad.success).toBe(false);
  });
});

describe("Instruction 20.9A — action response Zod", () => {
  it("accepts conforming action response", () => {
    const ok = RelationalFulfillmentActionResponseSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      previousStatus: "IN_TRANSFER",
      nextStatus: "ARRIVED_AT_DESTINATION",
      actionType: "TRANSITION",
      eventCreated: true,
      eventType: "FULFILLMENT_TRANSITIONED",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects response without paymentExecutionDisabled literal", () => {
    const bad = RelationalFulfillmentActionResponseSchema.safeParse({
      fulfillmentRecordId: "00000000-0000-4000-8000-000000000001",
      orderId: "00000000-0000-4000-8000-000000000002",
      relationshipId: "00000000-0000-4000-8000-000000000003",
      previousStatus: null,
      nextStatus: "IN_TRANSFER",
      actionType: "TRANSITION",
      eventCreated: true,
      eventType: "FULFILLMENT_TRANSITIONED",
      publicTrackingDisabled: true,
    });
    expect(bad.success).toBe(false);
  });
});
