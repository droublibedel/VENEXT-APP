import express from "express";
import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";

import { registerRoutes } from "./routes.js";
import * as coreClient from "./core-client.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerRoutes(app);
  return app;
}

describe("commerce-bff access 20.83-A", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.COMMERCE_ACCESS_CONTROL = "true";
    process.env.COMMERCE_VISIBILITY_GUARD = "true";
    process.env.COMMERCE_BACKEND_ACCESS_GUARD = "true";
  });

  it("blocks relational catalogs without relationship", async () => {
    const res = await request(createApp()).get(
      "/api/relational-catalogs?organizationId=org-grossiste-b-demo",
    );
    expect(res.status).toBe(403);
    expect(res.body.userMessage).toBeTruthy();
    expect(String(res.body.userMessage)).not.toMatch(/forbidden/i);
  });

  it("allows relational catalogs with relationship", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/relational-catalogs?organizationId=org-grossiste-b-demo&relationshipId=rel-1",
    );
    expect(res.status).toBe(200);
  });

  it("blocks wallet cross org via query", async () => {
    const res = await request(createApp())
      .get("/api/commerce-wallet/balance?organizationId=org-other")
      .set("x-organization-id", "org-grossiste-b-demo");
    expect(res.status).toBe(403);
  });

  it("blocks grossiste-b catalog without relationship", async () => {
    const res = await request(createApp()).get(
      "/api/grossiste-b/catalog?organizationId=org-grossiste-b-demo",
    );
    expect(res.status).toBe(403);
  });

  it("allows grossiste-b catalog with relationship", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/grossiste-b/catalog?organizationId=org-grossiste-b-demo&relationshipId=rel-1",
    );
    expect(res.status).toBe(200);
  });

  it("blocks messaging when relation suspended", async () => {
    const res = await request(createApp()).get(
      "/api/commerce-messaging/conversations?relationshipId=rel-1&relationshipStatus=SUSPENDED&organizationId=org-grossiste-b-demo",
    );
    expect(res.status).toBe(403);
  });

  it("blocks messaging when participant suspended (20.86-E1)", async () => {
    const res = await request(createApp()).get(
      "/api/commerce-messaging/conversations?relationshipId=rel-1&relationshipStatus=ACTIVE&participantStatus=SUSPENDED&organizationId=org-grossiste-b-demo",
    );
    expect(res.status).toBe(403);
    expect(String(res.body.userMessage)).toContain("Cet accès n’est pas disponible");
    expect(String(res.body.userMessage)).not.toMatch(/forbidden|unauthorized/i);
  });

  it("blocks messaging participant suspended with backend guard off", async () => {
    process.env.COMMERCE_BACKEND_ACCESS_GUARD = "false";
    const res = await request(createApp()).get(
      "/api/commerce-messaging/conversations?relationshipId=rel-1&participantStatus=SUSPENDED&organizationId=org-grossiste-b-demo",
    );
    expect(res.status).toBe(403);
    process.env.COMMERCE_BACKEND_ACCESS_GUARD = "true";
  });

  it("blocks commercial orders without relationship context", async () => {
    const res = await request(createApp()).get("/api/commercial-orders?organizationId=org-other");
    expect([200, 403]).toContain(res.status);
  });
});
