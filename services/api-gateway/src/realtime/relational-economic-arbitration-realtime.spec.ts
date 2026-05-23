import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicArbitrationRealtimeEventType,
  RelationalEconomicArbitrationRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-economic-arbitration realtime", () => {
  it("whitelists arbitration realtime types", () => {
    expect(isRelationalEconomicArbitrationRealtimeEventType("relational.arbitration.conflict_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicArbitrationRealtimeEventType("relational.arbitration.decision_created")).toBe(
      true,
    );
    expect(isRelationalEconomicArbitrationRealtimeEventType("relational.arbitration.unknown")).toBe(false);
  });

  it("parses strict minimal payload", () => {
    const p = RelationalEconomicArbitrationRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      arbitrationCaseId: null,
      caseCode: null,
      intensity: 50,
      arbitrationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
