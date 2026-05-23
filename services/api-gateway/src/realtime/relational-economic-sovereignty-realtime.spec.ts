import { describe, expect, it } from "vitest";
import { isRelationalEconomicSovereigntyRealtimeEventType } from "@venext/shared-contracts";

import { RelationalEconomicSovereigntyRealtimeSchema } from "@venext/shared-contracts";

describe("relational economic sovereignty realtime whitelist", () => {
  it("accepts known sovereignty event types", () => {
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.autonomy_detected")).toBe(true);
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.retention_applied")).toBe(true);
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.calibration_updated")).toBe(true);
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.edge_enriched")).toBe(true);
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.dashboard_refreshed")).toBe(true);
    expect(isRelationalEconomicSovereigntyRealtimeEventType("relational.sovereignty.unknown")).toBe(false);
  });

  it("rejects forbidden wallet fields in payload", () => {
    const p = RelationalEconomicSovereigntyRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      sovereigntyNodeId: null,
      sovereigntyNodeCode: null,
      intensity: 10,
      autonomyDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletBalance: 100,
    });
    expect(p.success).toBe(false);
  });
});
