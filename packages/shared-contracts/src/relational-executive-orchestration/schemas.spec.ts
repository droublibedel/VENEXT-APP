import { describe, expect, it } from "vitest";

import {
  isRelationalExecutiveOrchestrationRealtimeEventType,
  RelationalExecutiveOrchestrationOverviewSchema,
  RelationalExecutiveOrchestrationRealtimeSchema,
} from "./schemas.js";

describe("relational-executive-orchestration schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalExecutiveOrchestrationOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "EXEC_ORCH:test",
        orchestrationType: "EXECUTIVE_MATRIX",
        orchestrationPriority: "MEDIUM",
        orchestrationStatus: "ACTIVE",
        severity: "MEDIUM",
        orchestrationScore: 50,
        executiveCoordinationPressure: 40,
        systemicExposure: 35,
        executiveResilience: 60,
        strategicAlignmentScore: 55,
        governancePressure: 30,
        arbitrationPressure: 25,
        stabilizationPressure: 20,
        monitoringPressure: 15,
        recoveryPressure: 10,
        sovereigntyPressure: 12,
        dependencyPressure: 18,
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
      dependencies: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        dependencyCount: 0,
        executiveInstabilityDetected: false,
        coordinationBreakdownDetected: false,
        systemicConcentrationDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });

  it("whitelists executive orchestration realtime types", () => {
    expect(
      isRelationalExecutiveOrchestrationRealtimeEventType(
        "relational.executive_orchestration.instability_detected",
      ),
    ).toBe(true);
    expect(isRelationalExecutiveOrchestrationRealtimeEventType("relational.monitoring.unknown")).toBe(false);
  });

  it("parses strict minimal realtime payload", () => {
    const p = RelationalExecutiveOrchestrationRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      orchestrationNodeId: null,
      nodeCode: null,
      intensity: 50,
      orchestrationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
