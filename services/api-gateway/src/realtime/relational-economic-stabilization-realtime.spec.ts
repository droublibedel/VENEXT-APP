import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicStabilizationRealtimeEventType,
  RelationalEconomicStabilizationRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-economic-stabilization realtime", () => {
  it("whitelists stabilization realtime types", () => {
    expect(isRelationalEconomicStabilizationRealtimeEventType("relational.stabilization.stability_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicStabilizationRealtimeEventType("relational.stabilization.systemic_risk_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicStabilizationRealtimeEventType("relational.stabilization.unknown")).toBe(false);
  });

  it("parses strict minimal payload", () => {
    const p = RelationalEconomicStabilizationRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      stabilizationNodeId: null,
      nodeCode: null,
      intensity: 50,
      stabilizationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
