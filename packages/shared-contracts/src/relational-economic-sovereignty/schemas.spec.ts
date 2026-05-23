import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicSovereigntyRealtimeEventType,
  RelationalEconomicSovereigntyDashboardSchema,
  RelationalEconomicSovereigntyRealtimeSchema,
  RelationalEconomicSovereigntyRetentionDiagnosticsSchema,
} from "./schemas.js";

describe("relational-economic-sovereignty schemas", () => {
  it("whitelists sovereignty realtime types", () => {
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.autonomy_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.unknown")).toBe(false);
    const p = RelationalEconomicSovereigntyRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      sovereigntyNodeId: null,
      sovereigntyNodeCode: null,
      intensity: 50,
      autonomyDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.retention_applied")).toBe(true);
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.dashboard_refreshed")).toBe(true);
  });

  it("validates 20.28 dashboard and retention diagnostics", () => {
    const retention = RelationalEconomicSovereigntyRetentionDiagnosticsSchema.safeParse({
      retentionApplied: true,
      archivedSnapshotsCount: 2,
      preservedCriticalSnapshotsCount: 1,
      retentionPolicy: "max=24;days=90;preserveCritical=true",
      retentionReason: "max_snapshots_or_age_exceeded",
    });
    expect(retention.success).toBe(true);
    const dash = RelationalEconomicSovereigntyDashboardSchema.safeParse({
      organizationId: "00000000-0000-4000-8000-000000000001",
      corridorCount: 0,
      aggregateSovereigntyScore: 0,
      aggregateAutonomyScore: 0,
      aggregateCaptivityRisk: 0,
      aggregateExternalDependency: 0,
      mostCaptiveCorridors: [],
      mostAutonomousCorridors: [],
      highExternalDependencyCorridors: [],
      lowSovereigntyRiskCorridors: [],
      calibrationVersion: "SOVEREIGNTY_CALIBRATION_V1",
      calibrationProfile: "BALANCED",
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(dash.success).toBe(true);
  });
});
