import express from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";

import { registerRoutes } from "../routes.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerRoutes(app);
  return app;
}

describe("relational feed BFF", () => {
  it("GET /api/relational-feed never empty", async () => {
    const res = await request(createApp()).get(
      "/api/relational-feed?actorId=u1&role=detaillant&partnerIds=&partnersPublished=false",
    );
    expect(res.status).toBe(200);
    expect(res.body.payload.entries.length).toBeGreaterThan(0);
    expect(res.body.payload.feedEmptyPrevented).toBe(true);
  });

  it("GET with partners no posts injects sponsored", async () => {
    const res = await request(createApp()).get(
      "/api/relational-feed?partnerIds=p1,p2,p3&partnersPublished=false&categories=chaussures",
    );
    const types = res.body.payload.entries.map((e: { sponsored?: boolean }) => e.sponsored);
    expect(types.some(Boolean)).toBe(true);
  });

  it.each(Array.from({ length: 8 }, (_, i) => i))("feed batch %i", async (i) => {
    const res = await request(createApp()).get(`/api/relational-feed?categories=chaussures&seed=${i}`);
    expect(res.body.payload.entries.length).toBeGreaterThan(0);
  });
});
