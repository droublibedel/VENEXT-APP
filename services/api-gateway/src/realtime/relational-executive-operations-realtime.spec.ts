import { describe, expect, it } from "vitest";

import {
  isRelationalExecutiveOperationsRealtimeEventType,
  RelationalExecutiveOperationsRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-executive-operations realtime", () => {
  it("whitelists executive operations realtime types", () => {
    expect(isRelationalExecutiveOperationsRealtimeEventType("relational.executive_operations.matrix_generated")).toBe(
      true,
    );
    expect(
      isRelationalExecutiveOperationsRealtimeEventType("relational.executive_operations.executive_pressure_detected"),
    ).toBe(true);
    expect(isRelationalExecutiveOperationsRealtimeEventType("relational.strategic_command.grid_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal payload", () => {
    const p = RelationalExecutiveOperationsRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      operationsNodeId: null,
      nodeCode: null,
      intensity: 50,
      operationsDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalExecutiveOperationsRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      operationsNodeId: null,
      nodeCode: null,
      intensity: 50,
      operationsDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
