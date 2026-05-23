import { describe, expect, it } from "vitest";
import {
  isRelationalPredictiveRealtimeEventType,
  RelationalPredictiveOverviewSchema,
  RelationalPredictiveRealtimeSchema,
  RelationalPredictiveRiskSignalSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.13 — predictive risk contracts", () => {
  it("whitelist risk_detected", () => {
    expect(isRelationalPredictiveRealtimeEventType("relational.predictive.risk_detected")).toBe(true);
  });

  it("rejects description in realtime payload", () => {
    const bad = RelationalPredictiveRealtimeSchema.safeParse({
      riskSignalId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      riskLevel: "HIGH",
      riskType: "SLA_COLLAPSE_RISK",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      description: "long note",
    });
    expect(bad.success).toBe(false);
  });

  it("signal schema requires payment literal", () => {
    const bad = RelationalPredictiveRiskSignalSchema.safeParse({
      id: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      orderId: null,
      riskType: "OPERATIONAL_DRIFT_DETECTED",
      riskLevel: "MEDIUM",
      driftType: "FULFILLMENT_SLOWDOWN",
      title: "Drift",
      description: "Signal",
      signalScore: 42,
      confidenceLevel: 0.7,
      detectedAt: "2026-01-01T00:00:00.000Z",
      resolvedAt: null,
      publicTrackingDisabled: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(bad.success).toBe(false);
  });

  it("overview parses with literals", () => {
    const ok = RelationalPredictiveOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000002",
      corridorCollapseRisk: 72,
      operationalFragility: 55,
      sustainedOperationalDegradation: true,
      openRiskSignals: 3,
      criticalRiskSignals: 1,
      activeDriftSnapshots: 2,
      highestRiskLevel: "HIGH",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });
});
