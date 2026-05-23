import { describe, expect, it } from "vitest";

import {
  isRelationalStrategicIntelligenceRealtimeEventType,
  RelationalStrategicIntelligenceOverviewSchema,
  RelationalStrategicIntelligenceRealtimeSchema,
} from "./schemas.js";

describe("relational-strategic-intelligence schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalStrategicIntelligenceOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "INST_REP:test",
        intelligenceType: "CONSOLIDATED_OVERVIEW",
        intelligencePriority: "MEDIUM",
        intelligenceStatus: "ACTIVE",
        severity: "MEDIUM",
        strategicIntelligenceScore: 50,
        executiveExposure: 45,
        resilienceStrength: 60,
        systemicConcentration: 35,
        strategicAlignmentScore: 55,
        governancePressure: 30,
        arbitrationPressure: 25,
        stabilizationPressure: 20,
        monitoringPressure: 15,
        orchestrationPressure: 18,
        recoveryPressure: 10,
        sovereigntyPressure: 12,
        executiveUrgency: 45,
        territoryCountry: "SN",
        territoryCity: "DK",
        sectorSlug: null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentExecutionDisabled: false,
        publicTrackingDisabled: true,
      },
      signals: [],
      synthesiss: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        synthesisCount: 0,
        systemicPressureDetected: false,
        executiveExposureDetected: false,
        strategicPriorityDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });

  it("whitelists institutional reporting realtime types", () => {
    expect(
      isRelationalStrategicIntelligenceRealtimeEventType(
        "relational.strategic_intelligence.synthesis_generated",
      ),
    ).toBe(true);
    expect(isRelationalStrategicIntelligenceRealtimeEventType("relational.monitoring.unknown")).toBe(false);
  });

  it("parses strict minimal realtime payload", () => {
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
});
