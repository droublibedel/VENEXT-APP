import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerCommerceMarketCatalogRoutes } from "./commerce-market-catalog.routes.js";

vi.mock("../core-client.js", () => ({
  fetchCore: vi.fn(),
}));

import { fetchCore } from "../core-client.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerCommerceMarketCatalogRoutes(app);
  return app;
}

describe("ARCHI-05 commerce market catalogue matrix", () => {
  beforeEach(() => {
    vi.mocked(fetchCore).mockReset();
    vi.mocked(fetchCore).mockResolvedValue({
      ok: true,
      data: { lane: "market", products: [{ id: "p1", name: "Riz" }] },
      status: 200,
    });
  });

  describe.each([
    ["PRODUCER", false, true],
    ["GROSSISTE_B", true, false],
    ["DETAILLANT", true, false],
  ] as const)("actor %s", (role, marketAllowed, catalogueForbidden) => {
    it(`market feed allowed=${marketAllowed}`, async () => {
      const res = await request(createApp()).get(
        `/api/market/feed?organizationId=org-x&actorRole=${role}`,
      );
      if (marketAllowed) expect(res.status).toBe(200);
      else expect(res.status).toBe(403);
    });

    it(`catalogue blocked=${catalogueForbidden} for detaillant only`, async () => {
      vi.mocked(fetchCore).mockResolvedValue({
        ok: true,
        data: { lane: "catalogue", products: [] },
        status: 200,
      });
      const res = await request(createApp()).get(
        `/api/catalogue/my-products?organizationId=org-x&actorRole=${role}`,
      );
      if (role === "DETAILLANT") expect(res.status).toBe(403);
      else expect(res.status).toBe(200);
    });
  });

  it("transfer creates catalogue product with inheritance payload", async () => {
    vi.mocked(fetchCore).mockResolvedValue({
      ok: true,
      data: {
        ok: true,
        catalogProduct: { id: "cat-p1", name: "Riz revendu" },
        inheritance: { sourceProductId: "src-p1", sourceOrganizationId: "org-producer" },
      },
      status: 200,
    });
    const res = await request(createApp())
      .post("/api/market/products/src-p1/transfer")
      .send({ organizationId: "org-gb", actorRole: "GROSSISTE_B", userKey: "u1" });
    expect(res.status).toBe(200);
    expect(res.body.inheritance.sourceProductId).toBe("src-p1");
  });

  describe.each(Array.from({ length: 25 }, (_, i) => i))("transfer permission %i", (i) => {
  const role = i % 2 === 0 ? "GROSSISTE_B" : "DETAILLANT";
  it(`${role} transfer`, async () => {
    const res = await request(createApp())
      .post("/api/market/products/p1/transfer")
      .send({ organizationId: "org", actorRole: role });
    if (role === "DETAILLANT") expect(res.status).toBe(403);
    else expect(res.status).toBe(200);
  });
  });
});
