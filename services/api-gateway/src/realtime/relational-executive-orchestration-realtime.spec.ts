import { describe, expect, it } from "vitest";

import {
  isRelationalExecutiveOrchestrationRealtimeEventType,
  RelationalExecutiveOrchestrationRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-executive-orchestration realtime", () => {
  it("whitelists executive orchestration realtime types", () => {
    expect(
      isRelationalExecutiveOrchestrationRealtimeEventType(
        "relational.executive_orchestration.instability_detected",
      ),
    ).toBe(true);
    expect(
      isRelationalExecutiveOrchestrationRealtimeEventType(
        "relational.executive_orchestration.coordination_breakdown_detected",
      ),
    ).toBe(true);
    expect(isRelationalExecutiveOrchestrationRealtimeEventType("relational.monitoring.unknown")).toBe(false);
  });

  it("parses strict minimal payload", () => {
    const p = RelationalExecutiveOrchestrationRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      orchestrationNodeId: null,
      nodeCode: null,
      intensity: 50,
      orchestrationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
