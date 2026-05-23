import { describe, expect, it } from "vitest";
import {
  isRelationalOperationalRealtimeEventType,
  RelationalOperationalAlertSchema,
  RelationalOperationalRealtimeSchema,
  RelationalOperationalSlaSnapshotSchema,
} from "@venext/shared-contracts";

describe("Instruction 20.12 — operational intelligence contracts", () => {
  it("whitelist alert_created", () => {
    expect(isRelationalOperationalRealtimeEventType("relational.operational.alert_created")).toBe(true);
  });

  it("rejects description in realtime payload", () => {
    const bad = RelationalOperationalRealtimeSchema.safeParse({
      alertId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      severity: "WARNING",
      alertType: "SLA_DELAY_RISK",
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      description: "long internal note",
    });
    expect(bad.success).toBe(false);
  });

  it("alert schema requires payment literal", () => {
    const bad = RelationalOperationalAlertSchema.safeParse({
      id: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      orderId: null,
      fulfillmentRecordId: null,
      alertType: "FULFILLMENT_STAGNATION",
      severity: "WARNING",
      title: "Stagnation",
      description: "Signal corridor",
      detectedAt: "2026-01-01T00:00:00.000Z",
      resolvedAt: null,
      resolutionNotes: null,
      publicTrackingDisabled: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(bad.success).toBe(false);
  });

  it("sla snapshot parses with literals", () => {
    const ok = RelationalOperationalSlaSnapshotSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000002",
      corridorOperationalHealth: "CAUTION",
      corridorState: "DEGRADED",
      activeBlockingTasks: 1,
      activeIncidentCount: 0,
      averageFulfillmentDurationHours: 12,
      averageReceptionValidationDelayHours: 4,
      openOperationalAlerts: 2,
      criticalAlertsCount: 0,
      coordinationOpenTasks: 3,
      computedAt: "2026-01-01T00:00:00.000Z",
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(ok.success).toBe(true);
  });
});
