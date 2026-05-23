import { describe, expect, it } from "vitest";
import {
  isRelationalOperationalOrchestrationRealtimeEventType,
  RelationalOperationalOrchestrationRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.15 — relational.operational.orchestration_* realtime", () => {
  it("whitelist orchestration_created", () => {
    expect(isRelationalOperationalOrchestrationRealtimeEventType("relational.operational.orchestration_created")).toBe(
      true,
    );
  });

  it("rejects recommendation events on orchestration guard", () => {
    expect(isRelationalOperationalOrchestrationRealtimeEventType("relational.operational.recommendation_created")).toBe(
      false,
    );
  });

  it("rejects wallet fields in payload", () => {
    const bad = RelationalOperationalOrchestrationRealtimeSchema.safeParse({
      orchestrationId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      orchestrationType: "SLA_STABILIZATION",
      priority: "HIGH",
      status: "DRAFT",
      stepId: null,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletId: "w-1",
    });
    expect(bad.success).toBe(false);
  });
});
