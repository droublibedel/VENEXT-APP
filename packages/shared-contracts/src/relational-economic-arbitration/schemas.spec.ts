import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicArbitrationRealtimeEventType,
  RelationalEconomicArbitrationRealtimeSchema,
} from "./schemas.js";

describe("relational-economic-arbitration schemas", () => {
  it("whitelists arbitration realtime types", () => {
    expect(isRelationalEconomicArbitrationRealtimeEventType("relational.arbitration.conflict_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicArbitrationRealtimeEventType("relational.arbitration.unknown")).toBe(false);
    const rt = RelationalEconomicArbitrationRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      arbitrationCaseId: null,
      caseCode: null,
      intensity: 50,
      arbitrationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(rt.success).toBe(true);
  });

  it("rejects forbidden extra fields on realtime", () => {
    const p = RelationalEconomicArbitrationRealtimeSchema.safeParse({
      relationshipId: null,
      arbitrationCaseId: null,
      caseCode: null,
      intensity: 10,
      arbitrationDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletId: "x",
    });
    expect(p.success).toBe(false);
  });
});
