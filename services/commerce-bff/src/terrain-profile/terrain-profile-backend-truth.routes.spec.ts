import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerTerrainProfileRoutes } from "./terrain-profile.routes.js";
import {
  clearTerrainProfileAuditLog,
  clearTerrainProfileMemory,
  getTerrainProfileAuditLog,
} from "./terrain-profile-identity.service.js";

vi.mock("../core-client.js", () => ({
  fetchCore: vi.fn().mockResolvedValue({ ok: true, data: { payload: null } }),
}));

function createApp() {
  const app = express();
  app.use(express.json());
  registerTerrainProfileRoutes(app);
  return app;
}

describe("terrain-profile-backend-truth routes", () => {
  beforeEach(() => {
    clearTerrainProfileMemory();
    clearTerrainProfileAuditLog();
  });

  it("GET returns null identity for unknown user", async () => {
    const res = await request(createApp()).get("/api/terrain/profile-identity?userKey=22507000099");
    expect(res.status).toBe(200);
    expect(res.body.source).toBe("backend");
    expect(res.body.identity).toBeNull();
  });

  it("PUT current-profile persists onboarding profile", async () => {
    const res = await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000001", currentActiveProfile: "DETAILLANT", source: "onboarding" });
    expect(res.status).toBe(200);
    expect(res.body.identity.currentActiveProfile).toBe("detaillant");
    expect(res.body.identity.cachedProfile).toBe(false);
    expect(res.body.runtimeContext.ordersMode).toBe("supplier_purchases_upstream");
  });

  it("GET returns persisted profile after onboarding", async () => {
    await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000001", currentActiveProfile: "GROSSISTE_B" });
    const res = await request(createApp()).get("/api/terrain/profile-identity?userKey=22507000001");
    expect(res.body.identity.currentActiveProfile).toBe("grossiste_b");
    expect(res.body.identity.activeProfileVersion).toBeGreaterThan(0);
  });

  it("POST switch changes active profile in backend", async () => {
    await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000001", currentActiveProfile: "GROSSISTE_B" });
    const res = await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000001", targetProfile: "DETAILLANT", deviceId: "phone-a" });
    expect(res.status).toBe(200);
    expect(res.body.identity.currentActiveProfile).toBe("detaillant");
    expect(res.body.identity.lastActiveProfile).toBe("grossiste_b");
  });

  it("bootstraps identity on first switch when none exists", async () => {
    const res = await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000099", targetProfile: "DETAILLANT", deviceId: "phone-bootstrap" });
    expect(res.status).toBe(200);
    expect(res.body.identity.currentActiveProfile).toBe("detaillant");
    expect(res.body.identity.enabledProfiles).toContain("detaillant");
  });

  it("allows grossiste → détaillant switch while header still says grossiste", async () => {
    await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000004", currentActiveProfile: "GROSSISTE_B" });
    const res = await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .set("X-Venext-Active-Profile", "GROSSISTE_B")
      .set("X-Venext-User-Id", "22507000004")
      .send({ userKey: "22507000004", targetProfile: "DETAILLANT", deviceId: "phone-a" });
    expect(res.status).toBe(200);
    expect(res.body.identity.currentActiveProfile).toBe("detaillant");
  });

  it("rejects switch to invalid profile", async () => {
    await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000002", currentActiveProfile: "GROSSISTE_B" });
    const res = await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000002", targetProfile: "INVALID" });
    expect(res.status).toBe(403);
  });

  it("legacy PUT is disabled", async () => {
    const res = await request(createApp())
      .put("/api/terrain/profile-identity")
      .send({ userKey: "22507000001", currentActiveProfile: "DETAILLANT" });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe("use_backend_endpoints");
  });

  it("multi-device last switch wins via version increment", async () => {
    await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000003", currentActiveProfile: "GROSSISTE_B" });
    await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000003", targetProfile: "DETAILLANT", deviceId: "phone-a" });
    const phoneB = await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000003", targetProfile: "GROSSISTE_B", deviceId: "phone-b" });
    expect(phoneB.body.identity.currentActiveProfile).toBe("grossiste_b");
    expect(phoneB.body.identity.activeProfileVersion).toBeGreaterThan(2);
  });

  it("conflict resolves to server when client version stale", async () => {
    await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000004", currentActiveProfile: "GROSSISTE_B" });
    await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000004", targetProfile: "DETAILLANT" });
    const res = await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000004", targetProfile: "GROSSISTE_B", clientVersion: 1 });
    expect(res.status).toBe(200);
    expect(res.body.conflictResolved).toBe(true);
    expect(res.body.identity.currentActiveProfile).toBe("detaillant");
  });

  it("logs audit events for onboarding and switch", async () => {
    await request(createApp())
      .put("/api/terrain/profile-identity/current-profile")
      .send({ userKey: "22507000005", currentActiveProfile: "DETAILLANT" });
    await request(createApp())
      .post("/api/terrain/profile-identity/switch")
      .send({ userKey: "22507000005", targetProfile: "GROSSISTE_B" });
    const events = getTerrainProfileAuditLog().map((e) => e.event);
    expect(events).toContain("profile_selected_onboarding");
    expect(events).toContain("profile_switch_confirmed");
  });

  it("offline cache endpoint marks audit", async () => {
    await request(createApp())
      .post("/api/terrain/profile-identity/offline-cache")
      .send({ userKey: "22507000006" });
    const events = getTerrainProfileAuditLog().map((e) => e.event);
    expect(events).toContain("profile_cache_used_offline");
  });

  describe.each([
    ["22507000011", "GROSSISTE_B"],
    ["22507000012", "DETAILLANT"],
    ["22507000013", "GROSSISTE_B"],
    ["22507000014", "DETAILLANT"],
    ["22507000015", "GROSSISTE_B"],
    ["22507000016", "DETAILLANT"],
    ["22507000017", "GROSSISTE_B"],
    ["22507000018", "DETAILLANT"],
  ])("reinstall recovery user %s profile %s", (userKey, profile) => {
    it("GET restores backend profile on new device", async () => {
      await request(createApp())
        .put("/api/terrain/profile-identity/current-profile")
        .send({ userKey, currentActiveProfile: profile, deviceId: "phone-new" });
      const res = await request(createApp()).get(`/api/terrain/profile-identity?userKey=${userKey}`);
      expect(res.body.identity.currentActiveProfile).toBe(
        profile === "GROSSISTE_B" ? "grossiste_b" : "detaillant",
      );
    });
  });
});
