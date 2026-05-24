/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchTerrainGlobalSearch } from "../search/terrain-global-search.api";

describe("terrain global search API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls BFF terrain search endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        payload: {
          query: "abidjan",
          results: [{ id: "city-abidjan", kind: "city", label: "Abidjan" }],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchTerrainGlobalSearch("abidjan", "org-detaillant-demo", "DETAILLANT");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/terrain/search?q=abidjan"),
      expect.objectContaining({ credentials: "include" }),
    );
    expect(res.results[0]?.label).toBe("Abidjan");
  });
});
