import { describe, expect, it } from "vitest";

import {
  isRelationalInstitutionalReportingRealtimeEventType,
  RelationalInstitutionalReportingOverviewSchema,
  RelationalInstitutionalReportingRealtimeSchema,
} from "./schemas.js";

describe("relational-institutional-reporting schemas", () => {
  it("rejects forbidden payment fields on overview", () => {
    const p = RelationalInstitutionalReportingOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      node: {
        id: "00000000-0000-4000-8000-000000000002",
        relationshipId: "00000000-0000-4000-8000-000000000001",
        nodeCode: "INST_REP:test",
        reportingType: "INSTITUTIONAL_OVERVIEW",
        reportingPriority: "MEDIUM",
        reportingStatus: "ACTIVE",
        severity: "MEDIUM",
        institutionalScore: 50,
        executiveRisk: 45,
        strategicResilience: 60,
        systemicExposure: 35,
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
      briefs: [],
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        signalCount: 0,
        briefCount: 0,
        systemicRiskDetected: false,
        executivePressureDetected: false,
        institutionalPriorityDetected: false,
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });

  it("whitelists institutional reporting realtime types", () => {
    expect(
      isRelationalInstitutionalReportingRealtimeEventType(
        "relational.institutional_reporting.brief_generated",
      ),
    ).toBe(true);
    expect(isRelationalInstitutionalReportingRealtimeEventType("relational.monitoring.unknown")).toBe(false);
  });

  it("parses strict minimal realtime payload", () => {
    const p = RelationalInstitutionalReportingRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      reportingNodeId: null,
      nodeCode: null,
      intensity: 50,
      reportingDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
