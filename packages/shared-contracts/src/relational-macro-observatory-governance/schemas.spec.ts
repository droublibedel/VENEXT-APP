import { describe, expect, it } from "vitest";

import {
  isRelationalMacroObservatoryGovernanceRealtimeEventType,
  RelationalMacroObservatoryGovernanceOverviewSchema,
  RelationalMacroObservatoryGovernanceRealtimeSchema,
} from "./schemas.js";

describe("relational-macro-observatory-governance schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalMacroObservatoryGovernanceOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "MACRO_OBS_GOV:test",
        macroGovernanceType: "MACRO_GOVERNANCE_OVERVIEW",
        macroGovernancePriority: "MEDIUM",
        macroGovernanceStatus: "ACTIVE",
        severity: "MEDIUM",
        macroGovernanceScore: 50,
        executiveCoordinationPressure: 45,
        systemicConcentration: 48,
        resilienceStrength: 60,
        networkAlignmentPressure: 52,
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
        executiveCoordinationPressureDetected: false,
        systemicConcentrationDetected: false,
        macroGovernancePriorityDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });

  it("whitelists strategic observatory realtime types", () => {
    expect(
      isRelationalMacroObservatoryGovernanceRealtimeEventType("relational.macro_observatory_governance.matrix_generated"),
    ).toBe(true);
    expect(isRelationalMacroObservatoryGovernanceRealtimeEventType("relational.global_executive_supervision.matrix_generated")).toBe(
      false,
    );
  });

  it("parses strict minimal realtime payload", () => {
    const p = RelationalMacroObservatoryGovernanceRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      macroObservatoryGovernanceNodeId: null,
      nodeCode: null,
      intensity: 50,
      governanceDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
