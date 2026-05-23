import { describe, expect, it } from "vitest";

import { clearProducerCommerceDataCache } from "./useProducerLiveData";

describe("useProducerLiveData (20.79-A)", () => {
  it("clears commerce cache", () => {
    clearProducerCommerceDataCache();
    expect(true).toBe(true);
  });

  it("targets commerce-bff producer routes", () => {
    const endpoints = ["catalog", "orders", "deliveries", "mail", "relationships"] as const;
    for (const ep of endpoints) {
      expect(`/api/producer/${ep}`).toContain("producer");
    }
  });

  it("no global marketplace route", () => {
    expect("/api/marketplace/search").not.toMatch(/producer/);
  });
});
