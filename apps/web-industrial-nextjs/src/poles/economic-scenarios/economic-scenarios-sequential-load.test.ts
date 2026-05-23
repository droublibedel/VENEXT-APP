import { describe, expect, it, vi } from "vitest";

import { loadEconomicScenariosSlicesSequential } from "./economic-scenarios-sequential-load";

describe("economic-scenarios sequential load", () => {
  it("fetches four slices in order", async () => {
    const order: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const u = String(input);
        order.push(u);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { ok: u },
            sliceDiagnostics: {
              sliceSource: "FULL_BUNDLE_SLICE",
              serverCost: "FULL_COMPOSE",
              cacheStrategy: "SHORT_TTL_SCENARIO_CACHE",
              composeCacheHit: false,
            },
          }),
        } as Response;
      }),
    );
    const org = "31111111-1111-1111-1111-111111111101";
    const r = await loadEconomicScenariosSlicesSequential(org);
    expect(order.length).toBe(4);
    expect(String(order[0])).toContain("/overview");
    expect(r.overview).toEqual({ ok: expect.stringContaining("/overview") });
    vi.unstubAllGlobals();
  });
});
