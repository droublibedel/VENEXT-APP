import { describe, expect, it } from "vitest";

import {
  isRelationalGlobalExecutiveSupervisionRealtimeEventType,
  RelationalGlobalExecutiveSupervisionRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-global-executive-supervision realtime", () => {
  it("whitelists global executive supervision realtime types", () => {
    expect(
      isRelationalGlobalExecutiveSupervisionRealtimeEventType(
        "relational.global_executive_supervision.matrix_generated",
      ),
    ).toBe(true);
    expect(
      isRelationalGlobalExecutiveSupervisionRealtimeEventType(
        "relational.global_executive_supervision.executive_pressure_detected",
      ),
    ).toBe(true);
    expect(
      isRelationalGlobalExecutiveSupervisionRealtimeEventType(
        "relational.executive_strategic_synthesis.digest_generated",
      ),
    ).toBe(false);
  });

  it("parses strict minimal payload", () => {
    const p = RelationalGlobalExecutiveSupervisionRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      globalExecutiveSupervisionNodeId: null,
      nodeCode: null,
      intensity: 50,
      supervisionDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalGlobalExecutiveSupervisionRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      globalExecutiveSupervisionNodeId: null,
      nodeCode: null,
      intensity: 50,
      supervisionDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
