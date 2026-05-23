import { describe, expect, it } from "vitest";
import {
  isRelationalStrategicMemoryRealtimeEventType,
  RelationalStrategicMemoryRealtimeSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.18 — relational.memory.* realtime", () => {
  it("whitelist memory.created", () => {
    expect(isRelationalStrategicMemoryRealtimeEventType("relational.memory.created")).toBe(true);
  });

  it("rejects scenario review events", () => {
    expect(isRelationalStrategicMemoryRealtimeEventType("relational.scenario.review_created")).toBe(false);
  });

  it("rejects tracking fields", () => {
    const bad = RelationalStrategicMemoryRealtimeSchema.safeParse({
      memoryId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      memoryType: "SLA_RECOVERY",
      memorySeverity: "MEDIUM",
      confidenceLevel: 70,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      gpsCoordinates: "1,2",
    });
    expect(bad.success).toBe(false);
  });
});
