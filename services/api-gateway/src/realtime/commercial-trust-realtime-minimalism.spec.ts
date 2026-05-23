import { describe, expect, it } from "vitest";

import { extractCommercialTrustRealtimePayload } from "./realtime-economic-signal.gateway";

describe("Instruction 20.3A — commercial trust realtime minimalism", () => {
  it("extracts only whitelisted keys into payload", () => {
    const p = extractCommercialTrustRealtimePayload("commercial.trust.updated", {
      organizationId: "00000000-0000-4000-8000-000000000001",
      trustLevel: "STABLE",
      changedSignals: ["ORDER_FULFILLMENT_CONSISTENCY"],
      heuristicOnly: true,
      computedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(p?.organizationId).toBe("00000000-0000-4000-8000-000000000001");
    expect(p?.relationshipId).toBeNull();
    expect(p?.changedSignals).toEqual(["ORDER_FULFILLMENT_CONSISTENCY"]);
  });

  it("rejects fat bodies with extra keys (no metadata / prices in payload)", () => {
    const p = extractCommercialTrustRealtimePayload("commercial.trust.updated", {
      organizationId: "00000000-0000-4000-8000-000000000001",
      trustLevel: "STABLE",
      changedSignals: [],
      heuristicOnly: true,
      computedAt: "2026-01-01T00:00:00.000Z",
      metadata: { leak: true },
    } as Record<string, unknown>);
    expect(p).toBeUndefined();
  });

  it("detail contract: fixed phrases contain no JSON object dumps", () => {
    const trustDetail = "Commercial trust signal updated";
    const relDetail = "Commercial relationship signal changed";
    expect(trustDetail).not.toMatch(/\{/);
    expect(relDetail).not.toMatch(/\{/);
  });
});
