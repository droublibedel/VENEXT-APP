import { describe, expect, it } from "vitest";
import {
  isRelationalOperationalRecommendationRealtimeEventType,
  RelationalOperationalRecommendationRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.14 — relational.operational.recommendation_* realtime", () => {
  it("whitelist recommendation_created", () => {
    expect(isRelationalOperationalRecommendationRealtimeEventType("relational.operational.recommendation_created")).toBe(
      true,
    );
  });

  it("rejects unknown operational event under recommendation guard", () => {
    expect(isRelationalOperationalRecommendationRealtimeEventType("relational.operational.alert_created")).toBe(false);
  });

  it("rejects fileUrl in recommendation payload", () => {
    const bad = RelationalOperationalRecommendationRealtimeSchema.safeParse({
      recommendationId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      severity: "HIGH",
      recommendationType: "SLA_DEGRADATION_RECOMMENDATION",
      recommendationScore: 72,
      source: "SLA_ANALYSIS",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      fileUrl: "https://evil.example/x",
    });
    expect(bad.success).toBe(false);
  });
});
