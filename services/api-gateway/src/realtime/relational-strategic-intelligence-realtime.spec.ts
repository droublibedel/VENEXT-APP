import { describe, expect, it } from "vitest";

import {
  isRelationalStrategicIntelligenceRealtimeEventType,
  RelationalStrategicIntelligenceRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-strategic-intelligence realtime", () => {
  it("whitelists strategic intelligence realtime types", () => {
    expect(isRelationalStrategicIntelligenceRealtimeEventType("relational.strategic_intelligence.synthesis_generated")).toBe(
      true,
    );
    expect(isRelationalStrategicIntelligenceRealtimeEventType("relational.strategic_intelligence.resilience_detected")).toBe(
      true,
    );
    expect(isRelationalStrategicIntelligenceRealtimeEventType("relational.institutional_reporting.brief_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal payload", () => {
    const p = RelationalStrategicIntelligenceRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      intelligenceNodeId: null,
      nodeCode: null,
      intensity: 50,
      intelligenceDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalStrategicIntelligenceRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      intelligenceNodeId: null,
      nodeCode: null,
      intensity: 50,
      intelligenceDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
