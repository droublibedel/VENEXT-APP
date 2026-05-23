import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchRelationalOrderExecutionView } from "./relational-order-execution-api";

const organizationId = "00000000-0000-4000-8000-0000000000aa";
const orderId = "00000000-0000-4000-8000-0000000000bb";

const validView = {
  execution: {
    orderId,
    relationshipId: "00000000-0000-4000-8000-0000000000cc",
    executionStatus: "CREATED",
    buyerOrganizationId: "00000000-0000-4000-8000-0000000000dd",
    sellerOrganizationId: "00000000-0000-4000-8000-0000000000ee",
    lastEventType: null,
    lastTransitionAt: null,
    paymentExecutionDisabled: true as const,
    publicTrackingDisabled: true as const,
  },
  events: [] as unknown[],
};

describe("relational-order-execution-api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns relational_order_execution_response_invalid when JSON fails Zod", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ notAView: true }),
      }),
    );
    const r = await fetchRelationalOrderExecutionView(organizationId, orderId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("relational_order_execution_response_invalid");
  });

  it("returns ok data when payload is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => validView,
      }),
    );
    const r = await fetchRelationalOrderExecutionView(organizationId, orderId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.execution.orderId).toBe(orderId);
      expect(r.data.events).toEqual([]);
    }
  });
});
