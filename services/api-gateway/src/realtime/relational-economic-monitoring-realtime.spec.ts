import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicMonitoringRealtimeEventType,
  RelationalEconomicMonitoringRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-economic-monitoring realtime", () => {
  it("whitelists monitoring realtime types", () => {
    expect(isRelationalEconomicMonitoringRealtimeEventType("relational.monitoring.executive_alert_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicMonitoringRealtimeEventType("relational.monitoring.escalation_detected")).toBe(true);
    expect(isRelationalEconomicMonitoringRealtimeEventType("relational.monitoring.unknown")).toBe(false);
  });

  it("parses strict minimal payload", () => {
    const p = RelationalEconomicMonitoringRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      monitoringNodeId: null,
      nodeCode: null,
      intensity: 50,
      monitoringDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
