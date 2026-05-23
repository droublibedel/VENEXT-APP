import express from "express";
import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";

import { registerRoutes } from "../routes.js";
import { resetBffTerrainAudioStore } from "./terrain-audio-store.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerRoutes(app);
  return app;
}

beforeEach(() => {
  resetBffTerrainAudioStore();
});

describe("terrain audio BFF routes", () => {
  it("POST /api/terrain-audio", async () => {
    const res = await request(createApp())
      .post("/api/terrain-audio")
      .send({ ownerActorId: "gb", scopeType: "PRODUCT_DESCRIPTION", scopeId: "p1", durationSeconds: 5 });
    expect(res.status).toBe(200);
    expect(res.body.payload?.audioUrl).toContain("mock.venext.ci");
  });

  it("GET /api/terrain-audio/:id", async () => {
    const created = await request(createApp()).post("/api/terrain-audio").send({
      ownerActorId: "gb",
      scopeType: "PRODUCT_DESCRIPTION",
      scopeId: "p2",
      durationSeconds: 2,
    });
    const id = created.body.payload.id;
    const res = await request(createApp()).get(`/api/terrain-audio/${id}`);
    expect(res.status).toBe(200);
  });

  it("DELETE /api/terrain-audio/:id", async () => {
    const created = await request(createApp()).post("/api/terrain-audio").send({
      ownerActorId: "gb",
      scopeType: "BUSINESS_PROFILE",
      scopeId: "gb",
      durationSeconds: 10,
    });
    const res = await request(createApp()).delete(`/api/terrain-audio/${created.body.payload.id}`);
    expect(res.body.payload.deleted).toBe(true);
  });

  it("POST product audio-description", async () => {
    const res = await request(createApp())
      .post("/api/grossiste-b/products/pr-99/audio-description")
      .send({ durationSeconds: 8 });
    expect(res.body.payload?.productId).toBe("pr-99");
  });

  it("DELETE product audio-description", async () => {
    await request(createApp())
      .post("/api/grossiste-b/products/pr-del/audio-description")
      .send({ durationSeconds: 1 });
    const res = await request(createApp()).delete("/api/grossiste-b/products/pr-del/audio-description");
    expect(res.status).toBe(200);
  });

  it("POST profile business-audio", async () => {
    const res = await request(createApp())
      .post("/api/grossiste-b/profile/business-audio")
      .send({ durationSeconds: 45, optionalText: "Chaussures Adjamé" });
    expect(res.body.payload?.durationSeconds).toBeLessThanOrEqual(90);
  });

  it("GET partner-suggestions includes audio fields", async () => {
    const res = await request(createApp()).get("/api/partner-suggestions");
    expect(res.body.payload.suggestions.length).toBeGreaterThan(0);
    const withAudio = res.body.payload.suggestions.find((s: { businessAudioUrl?: string }) => s.businessAudioUrl);
    expect(withAudio?.businessAudioId).toBeTruthy();
  });

  it.each(Array.from({ length: 10 }, (_, i) => i))("create product audio batch %i", async (i) => {
    const res = await request(createApp())
      .post(`/api/grossiste-b/products/batch-${i}/audio-description`)
      .send({ durationSeconds: 1 + i });
    expect(res.status).toBe(200);
  });
});
