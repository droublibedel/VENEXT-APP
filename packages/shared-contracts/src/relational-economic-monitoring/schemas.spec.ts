import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicMonitoringRealtimeEventType,
  RelationalEconomicMonitoringOverviewSchema,
  RelationalEconomicMonitoringRealtimeSchema,
} from "./schemas.js";

describe("relational-economic-monitoring schemas", () => {
  it("rejects forbidden fields on overview", () => {
    const base = {
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "MON:1",
        monitoringType: "EXECUTIVE_SUPERVISION",
        monitoringPriority: "HIGH",
        monitoringStatus: "ACTIVE",
        severity: "HIGH",
        monitoringScore: 62,
        executivePressure: 58,
        systemicRisk: 55,
        resilienceLevel: 48,
        governancePressure: 50,
        arbitrationPressure: 45,
        stabilizationPressure: 52,
        sovereigntyPressure: 40,
        recoveryPressure: 46,
        coordinationPressure: 38,
        dependencyPressure: 54,
        executiveUrgency: 60,
        territoryCountry: "SN",
        territoryCity: "DK",
        sectorSlug: null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentExecutionDisabled: true,
        publicTrackingDisabled: true,
      },
      signals: [],
      alerts: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        alertCount: 0,
        strategicImbalanceDetected: false,
        systemicEscalationDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    expect(RelationalEconomicMonitoringOverviewSchema.safeParse(base).success).toBe(true);
    expect(RelationalEconomicMonitoringOverviewSchema.safeParse({ ...base, wallet: true }).success).toBe(false);
  });

  it("whitelists monitoring realtime types", () => {
    expect(isRelationalEconomicMonitoringRealtimeEventType("relational.monitoring.executive_alert_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicMonitoringRealtimeEventType("relational.monitoring.unknown")).toBe(false);
    const p = RelationalEconomicMonitoringRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      monitoringNodeId: null,
      nodeCode: null,
      intensity: 50,
      monitoringDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
