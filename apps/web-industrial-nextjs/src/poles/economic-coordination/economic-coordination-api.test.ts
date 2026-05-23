import { describe, expect, it, vi } from "vitest";

import { fetchEconomicCoordinationBundleJson } from "./economic-coordination-api";

describe("economic-coordination-api BFF paths", () => {
  it("bundle fetch targets /api/economic-coordination/", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ version: "1" }),
      }),
    );
    await fetchEconomicCoordinationBundleJson<{ version: string }>("org-1");
    const url = String((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0]);
    expect(url).toContain("/api/economic-coordination/");
    expect(url).toContain("projection=summary");
    vi.unstubAllGlobals();
  });
});
