import { describe, expect, it } from "vitest";

import {
  assertCatalogueAccess,
  assertMarketAccess,
  resolveActorEconomicLanes,
  resolveActorEconomicRole,
  sanitizeActorDisplayLabel,
  buildTransferAnalyticsPayload,
} from "./actor-economic-lanes.js";

describe("commerce-economic-lanes ARCHI-05", () => {
  describe.each([
    ["PRODUCER", true, false],
    ["PRODUCTEUR", true, false],
    ["GROSSISTE", true, true],
    ["GROSSISTE_A", true, true],
    ["GROSSISTE_B", true, true],
    ["WHOLESALER", true, true],
    ["DETAILLANT", false, true],
    ["RETAILER", false, true],
  ])("resolveActorEconomicRole(%s)", (input, hasCatalogue, hasMarket) => {
    it(`catalogue=${hasCatalogue} market=${hasMarket}`, () => {
      const lanes = resolveActorEconomicLanes(input);
      expect(lanes?.hasCatalogue).toBe(hasCatalogue);
      expect(lanes?.hasMarket).toBe(hasMarket);
    });
  });

  it("producteur sans market", () => {
    expect(assertMarketAccess("PRODUCER").allowed).toBe(false);
    expect(assertCatalogueAccess("PRODUCER").allowed).toBe(true);
  });

  it("detaillant sans catalogue", () => {
    expect(assertCatalogueAccess("DETAILLANT").allowed).toBe(false);
    expect(assertMarketAccess("DETAILLANT").allowed).toBe(true);
  });

  it("grossiste double univers", () => {
    expect(assertCatalogueAccess("GROSSISTE_B").allowed).toBe(true);
    expect(assertMarketAccess("GROSSISTE_B").allowed).toBe(true);
  });

  describe.each([
    ["Grossiste B — Réseau", "Grossiste — Réseau"],
    ["Grossiste A Nord", "Grossiste Nord"],
    ["grossiste b demo", "Grossiste demo"],
    ["Fournisseur Treichville", "Fournisseur Treichville"],
  ])("sanitizeActorDisplayLabel(%s)", (input, expected) => {
    it(`→ ${expected}`, () => {
      expect(sanitizeActorDisplayLabel(input)).toBe(expected);
    });
  });

  describe.each([
    "product_transferred_to_catalogue",
    "inherited_product_modified",
    "supplier_product_reshared",
    "catalogue_growth_from_market",
    "market_conversion_to_catalogue",
  ] as const)("analytics %s", (event) => {
    it("includes timestamp", () => {
      const payload = buildTransferAnalyticsPayload(event, { productId: "p1" });
      expect(payload.event).toBe(event);
      expect(payload.at).toBeTruthy();
    });
  });

  describe.each(Array.from({ length: 20 }, (_, i) => i))("matrix row %i", (i) => {
    const roles = ["PRODUCER", "GROSSISTE_B", "DETAILLANT"] as const;
    const role = roles[i % 3];
    it(`permissions for ${role}`, () => {
      const lanes = resolveActorEconomicLanes(role);
      expect(lanes).not.toBeNull();
      if (role === "PRODUCER") {
        expect(lanes!.hasMarket).toBe(false);
      }
      if (role === "DETAILLANT") {
        expect(lanes!.hasCatalogue).toBe(false);
      }
    });
  });

  describe.each(Array.from({ length: 30 }, (_, i) => i))("permission guard %i", (i) => {
    const role = i % 2 === 0 ? "GROSSISTE_B" : "DETAILLANT";
    it(`market vs catalogue for ${role}`, () => {
      const cat = assertCatalogueAccess(role);
      const mkt = assertMarketAccess(role);
      if (role === "DETAILLANT") {
        expect(cat.allowed).toBe(false);
        expect(mkt.allowed).toBe(true);
      } else {
        expect(cat.allowed).toBe(true);
        expect(mkt.allowed).toBe(true);
      }
    });
  });
});
