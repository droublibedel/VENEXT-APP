import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicRecoveryRealtimeEventType,
  RelationalEconomicRecoveryPlanSchema,
  RelationalEconomicRecoveryRealtimeSchema,
} from "./schemas.js";

describe("relational-economic-recovery schemas", () => {
  it("whitelists recovery realtime types", () => {
    expect(isRelationalEconomicRecoveryRealtimeEventType("relational.recovery.plan_generated")).toBe(true);
    expect(isRelationalEconomicRecoveryRealtimeEventType("relational.recovery.unknown")).toBe(false);
    const rt = RelationalEconomicRecoveryRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      recoveryPlanId: null,
      planCode: null,
      intensity: 50,
      recoveryDepth: 1,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(rt.success).toBe(true);
  });

  it("rejects forbidden extra fields on realtime", () => {
    const p = RelationalEconomicRecoveryRealtimeSchema.safeParse({
      relationshipId: null,
      recoveryPlanId: null,
      planCode: null,
      intensity: 10,
      recoveryDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletId: "x",
    });
    expect(p.success).toBe(false);
  });
});
