import { describe, expect, it } from "vitest";
import {
  RelationalMacroEconomicRealtimeSchema,
  isRelationalMacroEconomicRealtimeEventType,
} from "@venext/shared-contracts";

describe("relational-macro-economic realtime", () => {
  it("whitelists macro realtime event types", () => {
    expect(isRelationalMacroEconomicRealtimeEventType("relational.macro.resilience_detected")).toBe(true);
    expect(isRelationalMacroEconomicRealtimeEventType("relational.macro.unknown")).toBe(false);
    expect(isRelationalMacroEconomicRealtimeEventType("relational.supply.flow_created")).toBe(false);
  });

  it("parses minimal macro realtime body", () => {
    const parsed = RelationalMacroEconomicRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000099",
      macroNodeId: null,
      macroNodeCode: "MACRO:test:PRIMARY_RESILIENCE",
      intensity: 55,
      propagationDepth: 1,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(parsed.success).toBe(true);
  });
});
