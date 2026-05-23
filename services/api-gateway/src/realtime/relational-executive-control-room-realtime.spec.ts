import { describe, expect, it } from "vitest";

import {
  isRelationalExecutiveControlRoomRealtimeEventType,
  RelationalExecutiveControlRoomRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-executive-control-room realtime", () => {
  it("whitelists executive control room realtime types", () => {
    expect(
      isRelationalExecutiveControlRoomRealtimeEventType("relational.executive_control_room.board_generated"),
    ).toBe(true);
    expect(
      isRelationalExecutiveControlRoomRealtimeEventType(
        "relational.executive_control_room.executive_pressure_detected",
      ),
    ).toBe(true);
    expect(isRelationalExecutiveControlRoomRealtimeEventType("relational.executive_operations.matrix_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal payload", () => {
    const p = RelationalExecutiveControlRoomRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      controlRoomNodeId: null,
      nodeCode: null,
      intensity: 50,
      controlRoomDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalExecutiveControlRoomRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      controlRoomNodeId: null,
      nodeCode: null,
      intensity: 50,
      controlRoomDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
