import { describe, expect, it } from "vitest";

import {
  isRelationalExecutiveOperationsRealtimeEventType,
  RelationalExecutiveOperationsOverviewSchema,
  RelationalExecutiveOperationsRealtimeSchema,
} from "./schemas.js";

describe("relational-executive-operations schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalExecutiveOperationsOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "INST_REP:test",
        operationsType: "OPERATIONS_OVERVIEW",
        institutionalPressure: 22,
        intelligencePressure: 28,
        commandPressure: 24,
        operationsPriority: "MEDIUM",
        operationsStatus: "ACTIVE",
        severity: "MEDIUM",
        executiveOperationsScore: 50,
        systemicConcentration: 45,
        resilienceStrength: 60,
        executivePressure: 35,
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
      matrices: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        matrixCount: 0,
        executivePressureDetected: false,
        systemicConcentrationDetected: false,
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
      isRelationalExecutiveOperationsRealtimeEventType(
        "relational.executive_operations.matrix_generated",
      ),
    ).toBe(true);
    expect(isRelationalExecutiveOperationsRealtimeEventType("relational.monitoring.unknown")).toBe(false);
  });

  it("parses strict minimal realtime payload", () => {
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
});
