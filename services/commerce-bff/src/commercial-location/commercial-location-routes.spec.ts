import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import express from "express";
import { registerRoutes } from "../routes.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerRoutes(app);
  return app;
}
import { resetCommercialLocationStorageForTests } from "commercial-location-terrain";

describe("commercial-location routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.COMMERCE_ACCESS_CONTROL = "false";
    process.env.COMMERCE_VISIBILITY_GUARD = "false";
    process.env.COMMERCE_BACKEND_ACCESS_GUARD = "false";
    resetCommercialLocationStorageForTests();
  });

  it("POST /api/commercial-location manual city", async () => {
    const res = await request(createApp())
      .post("/api/commercial-location")
      .send({ actorId: "u1", city: "Yopougon" });
    expect(res.status).toBe(200);
    expect(res.body.payload.city).toBe("Yopougon");
    expect(res.body.payload.sourceType).toBe("MANUAL_CITY");
  });

  it("GET /api/commercial-location/me", async () => {
    await request(createApp()).post("/api/commercial-location").send({ actorId: "u2", city: "Abidjan" });
    const res = await request(createApp()).get("/api/commercial-location/me?actorId=u2");
    expect(res.status).toBe(200);
    expect(res.body.payload.profile.actorId).toBe("u2");
    expect(res.body.payload.publicView.city).toBe("Abidjan");
  });

  it("PATCH /api/commercial-location", async () => {
    await request(createApp()).post("/api/commercial-location").send({ actorId: "u3", city: "Abobo" });
    const res = await request(createApp())
      .patch("/api/commercial-location")
      .send({ actorId: "u3", district: "Sagbé" });
    expect(res.status).toBe(200);
    expect(res.body.payload.district).toBe("Sagbé");
  });

  it("GET me 404 when missing", async () => {
    const res = await request(createApp()).get("/api/commercial-location/me?actorId=missing");
    expect(res.status).toBe(404);
  });

  it("POST infers from phone fallback", async () => {
    const res = await request(createApp())
      .post("/api/commercial-location")
      .send({ actorId: "u4", phone: "+22507000000" });
    expect(res.status).toBe(200);
    expect(res.body.payload.sourceType).toBe("SYSTEM_INFERRED");
  });
});
