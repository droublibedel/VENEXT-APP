import { describe, expect, it } from "vitest";
import {
  isRelationalScenarioReviewRealtimeEventType,
  RelationalScenarioReviewRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.17 — relational.scenario.review_* realtime", () => {
  it("whitelist review_created", () => {
    expect(isRelationalScenarioReviewRealtimeEventType("relational.scenario.review_created")).toBe(true);
  });

  it("rejects operational simulation events", () => {
    expect(isRelationalScenarioReviewRealtimeEventType("relational.operational.simulation_started")).toBe(false);
  });

  it("rejects payment fields in payload", () => {
    const bad = RelationalScenarioReviewRealtimeSchema.safeParse({
      reviewBoardId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      reviewStatus: "PENDING_REVIEW",
      decisionType: "APPROVE_SIMULATION",
      decisionSeverity: "HIGH",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletId: "w-1",
    });
    expect(bad.success).toBe(false);
  });
});
