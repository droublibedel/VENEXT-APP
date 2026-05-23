import { describe, expect, it } from "vitest";
import { isRelationalEconomicContinuityRealtimeEventType } from "@venext/shared-contracts";

describe("relational economic continuity realtime whitelist", () => {
  it("accepts known continuity event types", () => {
    expect(isRelationalEconomicContinuityRealtimeEventType("relational.continuity.stability_detected")).toBe(true);
    expect(isRelationalEconomicContinuityRealtimeEventType("relational.continuity.unknown")).toBe(false);
  });
});
