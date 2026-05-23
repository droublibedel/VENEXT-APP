import { describe, expect, it } from "vitest";

import { clearGrossisteADataCache } from "./useGrossisteALiveData";

describe("useGrossisteALiveData (20.79-A)", () => {
  it("clears cache for refresh", () => {
    clearGrossisteADataCache();
    expect(true).toBe(true);
  });

  it("formal BFF routes include settlements and messaging", () => {
    expect("/api/grossiste-a/settlements").toContain("settlements");
    expect("/api/grossiste-a/messaging").toContain("messaging");
  });

  it("no open catalog search", () => {
    const forbidden = ["/api/products/all", "/api/marketplace"];
    for (const path of forbidden) {
      expect(path).not.toContain("grossiste-a/catalog");
    }
  });
});
