import { describe, expect, it } from "vitest";

import {
  isRelationalStrategicCommandRealtimeEventType,
  RelationalStrategicCommandRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-strategic-command realtime", () => {
  it("whitelists strategic command realtime types", () => {
    expect(isRelationalStrategicCommandRealtimeEventType("relational.strategic_command.grid_generated")).toBe(
      true,
    );
    expect(
      isRelationalStrategicCommandRealtimeEventType("relational.strategic_command.executive_concentration_detected"),
    ).toBe(true);
    expect(isRelationalStrategicCommandRealtimeEventType("relational.strategic_intelligence.synthesis_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal payload", () => {
    const p = RelationalStrategicCommandRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      commandNodeId: null,
      nodeCode: null,
      intensity: 50,
      commandDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalStrategicCommandRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      commandNodeId: null,
      nodeCode: null,
      intensity: 50,
      commandDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
