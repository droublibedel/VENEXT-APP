import { describe, expect, it } from "vitest";
import {
  RelationalSupplyFlowRealtimeSchema,
  isRelationalSupplyFlowRealtimeEventType,
} from "@venext/shared-contracts";

describe("Instruction 20.24 — relational.supply.* gateway contracts", () => {
  it("whitelists supply flow realtime event types", () => {
    expect(isRelationalSupplyFlowRealtimeEventType("relational.supply.flow_created")).toBe(true);
    expect(isRelationalSupplyFlowRealtimeEventType("relational.supply.unknown")).toBe(false);
  });

  it("rejects forbidden realtime keys (strict minimal payload)", () => {
    const parsed = RelationalSupplyFlowRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      flowNodeId: null,
      flowCode: "FLOW:X",
      intensity: 10,
      propagationDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      parcelId: "nope",
    });
    expect(parsed.success).toBe(false);
  });
});
