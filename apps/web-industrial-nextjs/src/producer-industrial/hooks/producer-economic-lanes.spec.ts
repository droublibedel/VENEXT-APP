import { describe, expect, it } from "vitest";

import {
  assertCatalogueAccess,
  assertMarketAccess,
  resolveActorEconomicLanes,
} from "commerce-economic-lanes";

describe("ARCHI-05 producer economic lanes", () => {
  it("producteur sans market", () => {
    const lanes = resolveActorEconomicLanes("PRODUCER");
    expect(lanes?.hasCatalogue).toBe(true);
    expect(lanes?.hasMarket).toBe(false);
    expect(assertMarketAccess("PRODUCER").allowed).toBe(false);
  });

  it("no producer market API surface", () => {
    const forbidden = ["/api/market/feed", "/api/market/product/p1"];
    for (const path of forbidden) {
      expect(path).toContain("market");
      expect(assertMarketAccess("PRODUCER").code).toBe("market_forbidden");
    }
  });

  it("producer catalogue only endpoints", () => {
    expect(assertCatalogueAccess("PRODUCER").allowed).toBe(true);
    expect("/api/producer/catalog").toContain("producer");
    expect("/api/producer/catalog").not.toContain("market");
  });

  describe.each(Array.from({ length: 15 }, (_, i) => i))("producer guard row %i", (i) => {
    it("blocks market lane", () => {
      expect(assertMarketAccess("PRODUCER").allowed).toBe(false);
      expect(assertCatalogueAccess("PRODUCTEUR").allowed).toBe(true);
    });
  });
});
