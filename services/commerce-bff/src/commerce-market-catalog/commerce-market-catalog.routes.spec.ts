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

describe("commerce-market-catalog routes ARCHI-05", () => {
  beforeEach(() => {
    vi.mocked(fetchCore).mockReset();
    vi.mocked(fetchCore).mockResolvedValue({
      ok: true,
      data: { organizationId: "org-x", lane: "market", products: [] },
      status: 200,
    });
  });

  it("blocks producer from market feed", async () => {
    const res = await request(createApp()).get(
      "/api/market/feed?organizationId=org-producer&actorRole=PRODUCER",
    );
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("market_forbidden");
  });

  it("blocks detaillant from catalogue my-products", async () => {
    const res = await request(createApp()).get(
      "/api/catalogue/my-products?organizationId=org-detaillant&actorRole=DETAILLANT",
    );
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("catalogue_forbidden");
  });

  it("allows grossiste market feed proxy", async () => {
    vi.mocked(fetchCore).mockResolvedValue({
      ok: true,
      data: { organizationId: "org-gb", lane: "market", products: [] },
      status: 200,
    });
    const res = await request(createApp()).get(
      "/api/market/feed?organizationId=org-gb&actorRole=GROSSISTE_B",
    );
    expect(res.status).toBe(200);
    expect(res.body.payload.lane).toBe("market");
  });

  it("allows grossiste catalogue proxy", async () => {
    vi.mocked(fetchCore).mockResolvedValue({
      ok: true,
      data: { organizationId: "org-gb", lane: "catalogue", products: [{ id: "p1" }] },
      status: 200,
    });
    const res = await request(createApp()).get(
      "/api/catalogue/my-products?organizationId=org-gb&actorRole=GROSSISTE_B",
    );
    expect(res.body.payload.lane).toBe("catalogue");
  });

  it("transfer requires catalogue permission", async () => {
    const res = await request(createApp())
      .post("/api/market/products/p1/transfer")
      .send({ organizationId: "org-dt", actorRole: "DETAILLANT" });
    expect(res.status).toBe(403);
  });

  it("transfer proxies to core", async () => {
    vi.mocked(fetchCore).mockResolvedValue({
      ok: true,
      data: { ok: true, catalogProduct: { id: "new-p" } },
      status: 200,
    });
    const res = await request(createApp())
      .post("/api/market/products/p1/transfer")
      .send({ organizationId: "org-gb", actorRole: "GROSSISTE_B" });
    expect(res.status).toBe(200);
    expect(res.body.catalogProduct.id).toBe("new-p");
  });

  describe.each(Array.from({ length: 40 }, (_, i) => i))("permission matrix %i", (i) => {
    const roles = ["PRODUCER", "GROSSISTE_B", "DETAILLANT"];
    const role = roles[i % 3];
    it(`${role} market access`, async () => {
      const res = await request(createApp()).get(
        `/api/market/feed?organizationId=org-${i}&actorRole=${role}`,
      );
      if (role === "PRODUCER") expect(res.status).toBe(403);
      else expect(res.status).not.toBe(403);
    });
  });

  describe.each(Array.from({ length: 40 }, (_, i) => i))("catalogue matrix %i", (i) => {
    const roles = ["PRODUCER", "GROSSISTE_B", "DETAILLANT"];
    const role = roles[i % 3];
    it(`${role} catalogue access`, async () => {
      vi.mocked(fetchCore).mockResolvedValue({ ok: true, data: { lane: "catalogue", products: [] }, status: 200 });
      const res = await request(createApp()).get(
        `/api/catalogue/my-products?organizationId=org-${i}&actorRole=${role}`,
      );
      if (role === "DETAILLANT") expect(res.status).toBe(403);
      else expect(res.status).toBe(200);
    });
  });
});
