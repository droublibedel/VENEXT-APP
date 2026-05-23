import { describe, expect, it } from "vitest";
import {
  isRelationalEconomicRecoveryRealtimeEventType,
  RelationalEconomicRecoveryRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational economic recovery realtime whitelist", () => {
  it("accepts known recovery event types", () => {
    expect(isRelationalEconomicRecoveryRealtimeEventType("relational.recovery.plan_generated")).toBe(true);
    expect(isRelationalEconomicRecoveryRealtimeEventType("relational.recovery.priority_detected")).toBe(true);
    expect(isRelationalEconomicRecoveryRealtimeEventType("relational.recovery.unknown")).toBe(false);
  });

  it("rejects forbidden wallet fields in payload", () => {
    const p = RelationalEconomicRecoveryRealtimeSchema.safeParse({
      relationshipId: null,
      recoveryPlanId: null,
      planCode: null,
      intensity: 10,
      recoveryDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletBalance: 100,
    });
    expect(p.success).toBe(false);
  });
});
