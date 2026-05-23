import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetBackofficeStore } from "backoffice-operational";

import { registerBackofficeRoutes } from "./backoffice-routes.js";

function app() {
  const a = express();
  a.use(express.json());
  registerBackofficeRoutes(a);
  return a;
}

async function waitBoot() {
  await new Promise((r) => setTimeout(r, 50));
}

const EMAIL = "ops@venext.ci";

async function loginToken(): Promise<string> {
  const a = app();
  const req = await request(a).post("/api/backoffice/auth/request-code").send({ email: EMAIL });
  const code = req.body.devCode as string;
  const ver = await request(a).post("/api/backoffice/auth/verify-code").send({ email: EMAIL, code });
  return ver.body.token as string;
}

beforeEach(() => resetBackofficeStore());
afterEach(() => resetBackofficeStore());

describe("BFF backoffice routes", () => {
  it("request-code + verify + dashboard", async () => {
    const a = app();
    await waitBoot();
    const token = await loginToken();
    const dash = await request(a)
      .get("/api/backoffice/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(dash.status).toBe(200);
    expect(dash.body.activeUsers).toBeDefined();
  });

  it("rejects dashboard without session", async () => {
    const res = await request(app()).get("/api/backoffice/dashboard");
    expect(res.status).toBe(401);
  });

  it("lists errors", async () => {
    const a = app();
    const token = await loginToken();
    const res = await request(a).get("/api/backoffice/errors").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.payload)).toBe(true);
  });

  it("lists journeys", async () => {
    const a = app();
    const token = await loginToken();
    const res = await request(a).get("/api/backoffice/journeys").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("health endpoint", async () => {
    const a = app();
    const token = await loginToken();
    const res = await request(a).get("/api/backoffice/health").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("search", async () => {
    const a = app();
    const token = await loginToken();
    const res = await request(a)
      .get("/api/backoffice/search")
      .query({ q: "Khadija" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("feature flags patch requires note", async () => {
    const a = app();
    const token = await loginToken();
    const res = await request(a)
      .patch("/api/backoffice/feature-flags/backoffice_auth_enabled")
      .set("Authorization", `Bearer ${token}`)
      .send({ enabled: false });
    expect(res.status).toBe(400);
  });

  it("logout", async () => {
    const a = app();
    const token = await loginToken();
    const res = await request(a).post("/api/backoffice/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(res.body.ok).toBe(true);
  });
});
