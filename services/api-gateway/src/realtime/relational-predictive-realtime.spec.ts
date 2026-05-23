import { describe, expect, it } from "vitest";
import {
  isRelationalPredictiveRealtimeEventType,
  RelationalPredictiveRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.13 — relational.predictive.* realtime", () => {
  it("whitelist sla_collapse_warning", () => {
    expect(isRelationalPredictiveRealtimeEventType("relational.predictive.sla_collapse_warning")).toBe(true);
  });

  it("rejects fileUrl in payload", () => {
    const bad = RelationalPredictiveRealtimeSchema.safeParse({
      riskSignalId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      riskLevel: "CRITICAL",
      riskType: "SLA_COLLAPSE_RISK",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      fileUrl: "https://evil.example/x",
    });
    expect(bad.success).toBe(false);
  });
});
