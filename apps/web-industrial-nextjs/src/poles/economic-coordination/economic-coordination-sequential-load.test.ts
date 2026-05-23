import { describe, expect, it, vi } from "vitest";

import { loadEconomicCoordinationSlicesSequential } from "./economic-coordination-sequential-load";

describe("economic-coordination sequential load", () => {
  it("calls endpoints in order", async () => {
    const order: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        order.push(url);
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: {} }) });
      }),
    );
    await loadEconomicCoordinationSlicesSequential("org-1");
    expect(order[0]).toContain("/overview");
    expect(order[1]).toContain("/posture");
    vi.unstubAllGlobals();
  });
});
