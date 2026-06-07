import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerTerrainLoginRoutes } from "./terrain-login.routes.js";

vi.mock("../core-client.js", () => ({
  fetchCore: vi.fn(),
}));

vi.mock("../terrain-otp/terrain-registration-store.js", () => ({
  verifyRegistrationToken: vi.fn(() => true),
  consumeRegistrationToken: vi.fn(() => true),
}));

import { fetchCore } from "../core-client.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerTerrainLoginRoutes(app);
  return app;
}

describe("terrain login ARCHI-04B reconnect", () => {
  beforeEach(() => {
    vi.mocked(fetchCore).mockReset();
  });

  it("restores detaillant session after OTP", async () => {
    vi.mocked(fetchCore).mockResolvedValue({
      ok: true,
      data: {
        payload: {
          organizationId: "org-detaillant-0701020304",
          profile: { displayName: "Boutique", phone: "0701020304", city: "Abidjan" },
        },
      },
      status: 200,
    });
    const res = await request(createApp())
      .post("/api/auth/terrain/login")
      .send({
        phone: "+2250701020304",
        registrationToken: "tok-1",
        actorRole: "DETAILLANT",
      });
    expect(res.status).toBe(200);
    expect(res.body.organizationId).toBe("org-detaillant-0701020304");
  });

  it("returns 404 when account missing", async () => {
    vi.mocked(fetchCore).mockResolvedValue({ ok: false, status: 502, data: null });
    const res = await request(createApp())
      .post("/api/auth/terrain/login")
      .send({ phone: "+2250701999999", registrationToken: "tok-1", actorRole: "DETAILLANT" });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("account_not_found");
  });
});
