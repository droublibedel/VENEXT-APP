import { describe, expect, it } from "vitest";

import {
  isRelationalExecutiveStrategicSynthesisRealtimeEventType,
  RelationalExecutiveStrategicSynthesisRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-executive-strategic-synthesis realtime", () => {
  it("whitelists executive strategic synthesis realtime types", () => {
    expect(
      isRelationalExecutiveStrategicSynthesisRealtimeEventType(
        "relational.executive_strategic_synthesis.digest_generated",
      ),
    ).toBe(true);
    expect(
      isRelationalExecutiveStrategicSynthesisRealtimeEventType(
        "relational.executive_strategic_synthesis.executive_exposure_detected",
      ),
    ).toBe(true);
    expect(isRelationalExecutiveStrategicSynthesisRealtimeEventType("relational.executive_control_room.board_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal payload", () => {
    const p = RelationalExecutiveStrategicSynthesisRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      strategicSynthesisNodeId: null,
      nodeCode: null,
      intensity: 50,
      synthesisDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalExecutiveStrategicSynthesisRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      strategicSynthesisNodeId: null,
      nodeCode: null,
      intensity: 50,
      synthesisDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
