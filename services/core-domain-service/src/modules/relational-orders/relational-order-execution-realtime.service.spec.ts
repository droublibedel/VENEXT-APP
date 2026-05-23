import { describe, expect, it, vi } from "vitest";

import { RelationalOrderExecutionRealtimeService } from "./relational-order-execution-realtime.service";

describe("Instruction 20.8A — relational order execution realtime envelope", () => {
  const org = "00000000-0000-4000-8000-0000000000a1";
  const orderId = "00000000-0000-4000-8000-0000000000b2";
  const relationshipId = "00000000-0000-4000-8000-0000000000c3";

  it("maps CANCELLED + EXECUTION_CANCELLED to relational.order.cancelled (distinct from blocked)", async () => {
    const postDomainSignal = vi.fn().mockResolvedValue(undefined);
    const svc = new RelationalOrderExecutionRealtimeService({ postDomainSignal } as never);
    await svc.publishToOrganization({
      organizationId: org,
      nextStatus: "CANCELLED",
      orderId,
      relationshipId,
      eventType: "EXECUTION_CANCELLED",
    });
    expect(postDomainSignal).toHaveBeenCalledWith(
      "/internal/v1/realtime/relational-orders/domain-signal",
      expect.objectContaining({
        organizationId: org,
        eventType: "relational.order.cancelled",
      }),
    );
  });

  it("maps BLOCKED status to relational.order.blocked", async () => {
    const postDomainSignal = vi.fn().mockResolvedValue(undefined);
    const svc = new RelationalOrderExecutionRealtimeService({ postDomainSignal } as never);
    await svc.publishToOrganization({
      organizationId: org,
      nextStatus: "BLOCKED",
      orderId,
      relationshipId,
      eventType: "EXECUTION_BLOCKED",
    });
    expect(postDomainSignal).toHaveBeenCalledWith(
      "/internal/v1/realtime/relational-orders/domain-signal",
      expect.objectContaining({ eventType: "relational.order.blocked" }),
    );
  });
});
