import { describe, expect, it } from "vitest";

import {
  isRelationalStrategicObservatoryRealtimeEventType,
  RelationalStrategicObservatoryOverviewSchema,
  RelationalStrategicObservatoryRealtimeSchema,
} from "./schemas.js";

describe("relational-strategic-observatory schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalStrategicObservatoryOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "STRAT_OBSERV:test",
        observatoryType: "OBSERVATORY_OVERVIEW",
        observatoryPriority: "MEDIUM",
        observatoryStatus: "ACTIVE",
        severity: "MEDIUM",
        observatoryScore: 50,
        executiveExposure: 45,
        systemicPressure: 48,
        resilienceStrength: 60,
        strategicCoordinationPressure: 52,
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
        synthesisPressure: 29,
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
      grids: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        gridCount: 0,
        executiveExposureDetected: false,
        systemicConcentrationDetected: false,
        observatoryPriorityDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });

  it("whitelists strategic observatory realtime types", () => {
    expect(
      isRelationalStrategicObservatoryRealtimeEventType("relational.strategic_observatory.grid_generated"),
    ).toBe(true);
    expect(isRelationalStrategicObservatoryRealtimeEventType("relational.global_executive_supervision.matrix_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal realtime payload", () => {
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
});
