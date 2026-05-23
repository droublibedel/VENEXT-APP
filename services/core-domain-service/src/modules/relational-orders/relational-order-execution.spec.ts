import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import {
  RelationalOrderExecutionRealtimeSchema,
  RelationalOrderExecutionTransitionDiagnosticsSchema,
  RelationalOrderExecutionTransitionRequestSchema,
  RelationalOrderExecutionTransitionResponseSchema,
} from "@venext/shared-contracts";

import { RelationalOrderExecutionPolicyService } from "./relational-order-execution-policy.service";

describe("Instruction 20.8 — relational order execution policy", () => {
  const p = new RelationalOrderExecutionPolicyService();

  it("allows CREATED -> PREPARING", () => {
    expect(() => p.assertTransitionAllowed("CREATED", "PREPARING")).not.toThrow();
  });

  it("forbids CREATED -> COMPLETED (direct completion)", () => {
    expect(() => p.assertTransitionAllowed("CREATED", "COMPLETED")).toThrow(BadRequestException);
  });

  it("forbids CREATED -> RECEIVED without transit chain", () => {
    expect(() => p.assertTransitionAllowed("CREATED", "RECEIVED")).toThrow(BadRequestException);
  });

  it("forbids transition after COMPLETED", () => {
    expect(() => p.assertTransitionAllowed("COMPLETED", "PREPARING")).toThrow(BadRequestException);
  });

  it("allows idempotent same-status (no-op)", () => {
    expect(() => p.assertTransitionAllowed("PREPARING", "PREPARING")).not.toThrow();
  });

  it("resolves event type for linear step", () => {
    expect(p.resolveEventType("CREATED", "PREPARING")).toBe("PREPARATION_STARTED");
  });

  it("resolves event type for cancellation as EXECUTION_CANCELLED (distinct from EXECUTION_BLOCKED)", () => {
    expect(p.resolveEventType("CREATED", "CANCELLED")).toBe("EXECUTION_CANCELLED");
    expect(p.resolveEventType("PREPARING", "BLOCKED")).toBe("EXECUTION_BLOCKED");
  });

  it("forbids COMPLETED -> DISPATCHED (terminal corridor)", () => {
    expect(() => p.assertTransitionAllowed("COMPLETED", "DISPATCHED")).toThrow(BadRequestException);
  });

  it("allows PREPARING -> READY_FOR_DISPATCH", () => {
    expect(() => p.assertTransitionAllowed("PREPARING", "READY_FOR_DISPATCH")).not.toThrow();
  });
});

describe("Instruction 20.8 — Zod contracts", () => {
  it("RelationalOrderExecutionRealtimeSchema is strict", () => {
    const ok = RelationalOrderExecutionRealtimeSchema.safeParse({
      orderId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      executionStatus: "DISPATCHED",
      eventType: "DISPATCH_CONFIRMED",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
    const bad = RelationalOrderExecutionRealtimeSchema.safeParse({
      orderId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      executionStatus: "DISPATCHED",
      eventType: "DISPATCH_CONFIRMED",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      extra: 1,
    });
    expect(bad.success).toBe(false);
  });

  it("RelationalOrderExecutionTransitionResponseSchema enforces payment/public tracking literals", () => {
    const ok = RelationalOrderExecutionTransitionResponseSchema.safeParse({
      ok: true,
      idempotent: false,
      orderId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      previousStatus: "CREATED",
      nextStatus: "PREPARING",
      eventCreated: true,
      eventType: "PREPARATION_STARTED",
      diagnostics: undefined,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      realtimePublishAttempted: true,
      realtimePublished: true,
    });
    expect(ok.success).toBe(true);
    const bad = RelationalOrderExecutionTransitionResponseSchema.safeParse({
      ok: true,
      idempotent: false,
      orderId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      previousStatus: "CREATED",
      nextStatus: "PREPARING",
      eventCreated: true,
      eventType: "PREPARATION_STARTED",
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
      realtimePublishAttempted: true,
      realtimePublished: true,
    });
    expect(bad.success).toBe(false);
  });

  it("RelationalOrderExecutionTransitionDiagnosticsSchema accepts standard completion semantics", () => {
    const r = RelationalOrderExecutionTransitionDiagnosticsSchema.safeParse({
      corridorExecutionGovernanceValidated: true,
      corridorStateAtExecution: "ACTIVE",
      relationshipIdSource: "ORDER_RELATIONSHIP",
      relationshipIdConsistencyValidated: true,
      orderExecutionAllowed: true,
      orderExecutionWarningCodes: [],
      completionKind: "STANDARD_EXECUTION_COMPLETED",
      fulfilledAsPartial: false,
      requiresFulfillmentReview: false,
      partialFulfillmentResolved: false,
    });
    expect(r.success).toBe(true);
  });

  it("RelationalOrderExecutionTransitionDiagnosticsSchema accepts partial fulfillment completion semantics", () => {
    const r = RelationalOrderExecutionTransitionDiagnosticsSchema.safeParse({
      corridorExecutionGovernanceValidated: true,
      corridorStateAtExecution: "ACTIVE",
      relationshipIdSource: "ORDER_RELATIONSHIP",
      relationshipIdConsistencyValidated: true,
      orderExecutionAllowed: true,
      orderExecutionWarningCodes: [],
      completionKind: "PARTIAL_FULFILLMENT_COMPLETED",
      fulfilledAsPartial: true,
      requiresFulfillmentReview: true,
      partialFulfillmentResolved: true,
    });
    expect(r.success).toBe(true);
  });

  it("RelationalOrderExecutionTransitionRequestSchema accepts minimal body", () => {
    const r = RelationalOrderExecutionTransitionRequestSchema.safeParse({ targetStatus: "PREPARING" });
    expect(r.success).toBe(true);
  });

  it("RelationalOrderExecutionRealtimeSchema rejects forbidden diagnostics keys (e.g. GPS)", () => {
    const bad = RelationalOrderExecutionRealtimeSchema.safeParse({
      orderId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      executionStatus: "DISPATCHED",
      eventType: "DISPATCH_CONFIRMED",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      diagnostics: { completionKind: "STANDARD_EXECUTION_COMPLETED", gpsLatitude: 1 },
    });
    expect(bad.success).toBe(false);
  });
});
