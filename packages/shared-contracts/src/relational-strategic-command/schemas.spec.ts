import { describe, expect, it } from "vitest";

import {
  isRelationalStrategicCommandRealtimeEventType,
  RelationalStrategicCommandOverviewSchema,
  RelationalStrategicCommandRealtimeSchema,
} from "./schemas.js";

describe("relational-strategic-command schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalStrategicCommandOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "INST_REP:test",
        commandType: "COMMAND_OVERVIEW",
        institutionalPressure: 22,
        intelligencePressure: 28,
        commandPriority: "MEDIUM",
        commandStatus: "ACTIVE",
        severity: "MEDIUM",
        commandScore: 50,
        executiveConcentration: 45,
        resilienceStrength: 60,
        systemicPressure: 35,
        strategicBalanceScore: 55,
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
      grids: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        gridCount: 0,
        systemicPressureDetected: false,
        executiveConcentrationDetected: false,
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
      isRelationalStrategicCommandRealtimeEventType(
        "relational.strategic_command.grid_generated",
      ),
    ).toBe(true);
    expect(isRelationalStrategicCommandRealtimeEventType("relational.monitoring.unknown")).toBe(false);
  });

  it("parses strict minimal realtime payload", () => {
    const p = RelationalStrategicCommandRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      commandNodeId: null,
      nodeCode: null,
      intensity: 50,
      commandDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
