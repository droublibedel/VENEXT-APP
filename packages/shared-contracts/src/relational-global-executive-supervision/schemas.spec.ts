import { describe, expect, it } from "vitest";

import {
  isRelationalGlobalExecutiveSupervisionRealtimeEventType,
  RelationalGlobalExecutiveSupervisionOverviewSchema,
  RelationalGlobalExecutiveSupervisionRealtimeSchema,
} from "./schemas.js";

describe("relational-global-executive-supervision schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalGlobalExecutiveSupervisionOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "EXEC_SUPERV:test",
        supervisionType: "SUPERVISION_OVERVIEW",
        supervisionPriority: "MEDIUM",
        supervisionStatus: "ACTIVE",
        severity: "MEDIUM",
        supervisionScore: 50,
        systemicExposure: 45,
        resilienceStrength: 60,
        executivePressure: 35,
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
      matrices: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        matrixCount: 0,
        executivePressureDetected: false,
        systemicExposureDetected: false,
        supervisionPriorityDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });

  it("whitelists executive strategic synthesis realtime types", () => {
    expect(
      isRelationalGlobalExecutiveSupervisionRealtimeEventType(
        "relational.global_executive_supervision.matrix_generated",
      ),
    ).toBe(true);
    expect(isRelationalGlobalExecutiveSupervisionRealtimeEventType("relational.executive_control_room.board_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal realtime payload", () => {
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
});
