import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicStabilizationRealtimeEventType,
  RelationalEconomicStabilizationOverviewSchema,
  RelationalEconomicStabilizationRealtimeSchema,
} from "./schemas.js";

describe("relational-economic-stabilization schemas", () => {
  it("rejects forbidden autopilot fields on overview", () => {
    const base = {
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "STAB:1",
        stabilizationType: "STRATEGIC_STABILIZATION",
        stabilizationPriority: "MEDIUM",
        stabilizationStatus: "ACTIVE",
        severity: "MEDIUM",
        stabilizationScore: 55,
        instabilityPressure: 40,
        resilienceLevel: 60,
        systemicExposure: 35,
        dependencyPressure: 50,
        continuityPressure: 45,
        sovereigntyPressure: 42,
        arbitrationPressure: 38,
        governancePressure: 44,
        recoveryPressure: 48,
        coordinationStress: 36,
        stabilizationUrgency: 52,
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
      dependencies: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        traversalDepth: 2,
        visitedCorridors: 3,
        boundedTraversalApplied: true,
        signalCount: 0,
        dependencyCount: 0,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    expect(RelationalEconomicStabilizationOverviewSchema.safeParse(base).success).toBe(true);
    expect(
      RelationalEconomicStabilizationOverviewSchema.safeParse({ ...base, walletId: "x" }).success,
    ).toBe(false);
  });

  it("whitelists stabilization realtime types", () => {
    expect(isRelationalEconomicStabilizationRealtimeEventType("relational.stabilization.stability_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicStabilizationRealtimeEventType("relational.stabilization.unknown")).toBe(false);
    const p = RelationalEconomicStabilizationRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      stabilizationNodeId: null,
      nodeCode: null,
      intensity: 50,
      stabilizationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
