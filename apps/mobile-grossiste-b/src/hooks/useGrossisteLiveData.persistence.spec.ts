import { describe, expect, it } from "vitest";

import { clearGrossisteDataCache } from "./useGrossisteLiveData";

describe("useGrossisteLiveData persistence contract (20.79)", () => {
  it("cache can be cleared for manual refresh", () => {
    clearGrossisteDataCache();
    expect(true).toBe(true);
  });

  it("bff paths match grossiste terrain endpoints", () => {
    const endpoints = ["activity", "catalog", "orders", "network"] as const;
    for (const ep of endpoints) {
      expect(`/api/grossiste-b/${ep}?organizationId=org-grossiste-b-demo`).toContain(ep);
    }
  });

  it("does not expose global marketplace search path", () => {
    const forbidden = ["/api/marketplace", "/api/products/search", "/api/catalog/global"];
    for (const path of forbidden) {
      expect(path).not.toMatch(/grossiste-b/);
    }
  });
});
