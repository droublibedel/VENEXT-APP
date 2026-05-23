import { describe, expect, it } from "vitest";

import {
  isRelationalStrategicObservatoryRealtimeEventType,
  RelationalStrategicObservatoryRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-strategic-observatory realtime", () => {
  it("whitelists strategic observatory realtime types", () => {
    expect(isRelationalStrategicObservatoryRealtimeEventType("relational.strategic_observatory.grid_generated")).toBe(
      true,
    );
    expect(
      isRelationalStrategicObservatoryRealtimeEventType(
        "relational.strategic_observatory.systemic_concentration_detected",
      ),
    ).toBe(true);
    expect(isRelationalStrategicObservatoryRealtimeEventType("relational.global_executive_supervision.matrix_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal payload", () => {
    const p = RelationalStrategicObservatoryRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      strategicObservatoryNodeId: null,
      nodeCode: null,
      intensity: 50,
      observatoryDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalStrategicObservatoryRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      strategicObservatoryNodeId: null,
      nodeCode: null,
      intensity: 50,
      observatoryDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
