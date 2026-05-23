import { describe, expect, it } from "vitest";

import {
  isRelationalInstitutionalReportingRealtimeEventType,
  RelationalInstitutionalReportingRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-institutional-reporting realtime", () => {
  it("whitelists institutional reporting realtime types", () => {
    expect(isRelationalInstitutionalReportingRealtimeEventType("relational.institutional_reporting.brief_generated")).toBe(
      true,
    );
    expect(isRelationalInstitutionalReportingRealtimeEventType("relational.institutional_reporting.resilience_detected")).toBe(
      true,
    );
    expect(isRelationalInstitutionalReportingRealtimeEventType("relational.executive_orchestration.unknown")).toBe(
      false,
    );
  });

  it("parses strict minimal payload", () => {
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
