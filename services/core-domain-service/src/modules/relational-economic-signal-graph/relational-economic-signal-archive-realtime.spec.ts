import { describe, expect, it, vi } from "vitest";

import { RelationalEconomicSignalRealtimeService } from "./relational-economic-signal-realtime.service";

describe("Instruction 20.19A — signal_archived realtime", () => {
  it("publishes journal eventType SIGNAL_ARCHIVED in minimal payload", async () => {
    const fanout = { postDomainSignal: vi.fn().mockResolvedValue(undefined) };
    const flags = { isEnabled: vi.fn().mockResolvedValue(true) };
    const svc = new RelationalEconomicSignalRealtimeService(
      fanout as never,
      flags as never,
    );

    await svc.publishBothSides({
      buyerOrganizationId: "00000000-0000-4000-8000-000000000010",
      sellerOrganizationId: "00000000-0000-4000-8000-000000000011",
      nodeId: "00000000-0000-4000-8000-000000000001",
      relationshipId: "00000000-0000-4000-8000-000000000002",
      propagationRisk: "MEDIUM",
      systemicExposureScore: 40,
      journalEventType: "SIGNAL_ARCHIVED",
      realtimeEventType: "relational.economic.signal_archived",
    });

    expect(fanout.postDomainSignal).toHaveBeenCalled();
    const call = fanout.postDomainSignal.mock.calls[0]![1] as {
      eventType: string;
      body: Record<string, unknown>;
    };
    expect(call.eventType).toBe("relational.economic.signal_archived");
    expect(call.body.eventType).toBe("SIGNAL_ARCHIVED");
    expect(call.body.paymentExecutionDisabled).toBe(true);
    expect(call.body.publicTrackingDisabled).toBe(true);
    expect(call.body).not.toHaveProperty("gpsCoordinates");
  });
});
