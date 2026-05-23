import { describe, expect, it } from "vitest";

import {
  isRelationalExecutiveStrategicSynthesisRealtimeEventType,
  RelationalExecutiveStrategicSynthesisOverviewSchema,
  RelationalExecutiveStrategicSynthesisRealtimeSchema,
} from "./schemas.js";

describe("relational-executive-strategic-synthesis schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalExecutiveStrategicSynthesisOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "EXEC_SYNTH:test",
        synthesisType: "SYNTHESIS_OVERVIEW",
        synthesisPriority: "MEDIUM",
        synthesisStatus: "ACTIVE",
        severity: "MEDIUM",
        synthesisScore: 50,
        systemicPressure: 45,
        resilienceStrength: 60,
        executiveExposure: 35,
        strategicAlignmentScore: 55,
        governancePressure: 30,
        arbitrationPressure: 25,
        stabilizationPressure: 20,
        monitoringPressure: 15,
        orchestrationPressure: 18,
        institutionalPressure: 22,
        intelligencePressure: 28,
        commandPressure: 24,
        operationsPressure: 26,
        controlRoomPressure: 27,
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
      digests: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        digestCount: 0,
        executiveExposureDetected: false,
        systemicPressureDetected: false,
        strategicPriorityDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });

  it("whitelists executive strategic synthesis realtime types", () => {
    expect(
      isRelationalExecutiveStrategicSynthesisRealtimeEventType(
        "relational.executive_strategic_synthesis.digest_generated",
      ),
    ).toBe(true);
    expect(isRelationalExecutiveStrategicSynthesisRealtimeEventType("relational.executive_control_room.board_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal realtime payload", () => {
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
});
