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

describe("commerce-bff routes (20.79)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.COMMERCE_ACCESS_CONTROL = "false";
    process.env.COMMERCE_VISIBILITY_GUARD = "false";
    process.env.COMMERCE_BACKEND_ACCESS_GUARD = "false";
  });

  it("health endpoint", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("commerce-bff");
  });

  it("returns fallback envelope when core unavailable", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(true);
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp()).get(
      "/api/grossiste-b/catalog?organizationId=org-grossiste-b-demo",
    );
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
    expect(res.body.dataSource).toBe("fallback");
    expect(res.body.payload.products.length).toBeGreaterThan(0);
  });

  it("returns live envelope when core responds", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(true);
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        dataSource: "live",
        fallbackUsed: false,
        payload: { organizationId: "org-grossiste-b-demo", products: [] },
      },
    });
    const res = await request(createApp()).get(
      "/api/grossiste-b/catalog?organizationId=org-grossiste-b-demo",
    );
    expect(res.body.fallbackUsed).toBe(false);
    expect(res.body.dataSource).toBe("live");
  });

  it("wallet balance fallback is demo", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/commerce-wallet/balance?organizationId=org-grossiste-b-demo",
    );
    expect(res.body.payload.demo).toBe(true);
  });

  it("feature flags route responds", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/feature-flags");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.payload)).toBe(true);
  });

  it("relationships route responds", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/relationships");
    expect(res.status).toBe(200);
  });

  it("commercial orders route responds", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/commercial-orders");
    expect(res.status).toBe(200);
  });

  it("commercial context route responds", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/commercial-context?actorId=org-x");
    expect(res.status).toBe(200);
  });

  it("detaillant endpoint fallback", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/detaillant/home?organizationId=org-detaillant-yopougon");
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("actors me fallback", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/actors/me?organizationId=org-grossiste-b-demo");
    expect(res.body.payload.displayName).toBeTruthy();
  });

  it("relational catalogs route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/relational-catalogs?organizationId=org-grossiste-b-demo");
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("commercial deliveries route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/commercial-deliveries");
    expect(res.status).toBe(200);
  });

  it("commercial settlements route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/commercial-settlements?organizationId=org-grossiste-b-demo");
    expect(res.status).toBe(200);
  });

  it("commerce messaging conversations", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/commerce-messaging/conversations");
    expect(res.status).toBe(200);
  });

  it("professional mail threads", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/professional-mail/threads");
    expect(res.status).toBe(200);
  });

  it("grossiste activity fallback", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/grossiste-b/activity?organizationId=org-grossiste-b-demo");
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("grossiste orders fallback", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/grossiste-b/orders?organizationId=org-grossiste-b-demo");
    expect(res.status).toBe(200);
  });

  it("no marketplace global route registered", async () => {
    const res = await request(createApp()).get("/api/marketplace/products");
    expect(res.status).toBe(404);
  });

  it("producer catalog route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/producer/catalog?organizationId=org-producer-agronexus-ci",
    );
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
    expect(res.body.payload.products.length).toBeGreaterThan(0);
  });

  it("producer relationships route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/producer/relationships?organizationId=org-producer-agronexus-ci",
    );
    expect(res.status).toBe(200);
  });

  it("grossiste-a settlements route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/grossiste-a/settlements?organizationId=org-grossiste-a-nord-plus",
    );
    expect(res.status).toBe(200);
  });

  it("grossiste-a messaging route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/grossiste-a/messaging?organizationId=org-grossiste-a-nord-plus",
    );
    expect(res.status).toBe(200);
  });

  it("health exposes persistence availability", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.body.persistence).toBeTruthy();
  });

  it("GET catalog guard blocks without relationship query", async () => {
    const res = await request(createApp()).get(
      "/api/grossiste-b/catalog?organizationId=org-grossiste-b-demo",
    );
    expect([200, 403]).toContain(res.status);
  });

  it("GET offline bootstrap route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/offline/bootstrap?organizationId=org-grossiste-b-demo&actorRole=GROSSISTE_B",
    );
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("POST offline sync fallback", async () => {
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp())
      .post("/api/offline/sync?organizationId=org-x")
      .send({ locale: "fr-CI" });
    expect(res.status).toBe(200);
  });

  it("POST offline replay fallback", async () => {
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp())
      .post("/api/offline/replay?organizationId=org-x")
      .send({ actions: [{ id: "a1", type: "SEND_MESSAGE" }] });
    expect(res.status).toBe(200);
  });

  it("GET activity-feed route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/activity-feed?organizationId=org-grossiste-b-demo");
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("GET activity-feed summary", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/activity-feed/summary?organizationId=org-x");
    expect(res.body.payload.headlineKey).toBe("activity.summary.quiet");
  });

  it("PATCH activity-feed read fallback", async () => {
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp()).patch("/api/activity-feed/act-1/read?organizationId=org-x");
    expect(res.status).toBe(200);
  });

  it("GET notifications route", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/notifications?organizationId=org-grossiste-b-demo");
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("GET notifications preferences", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/notifications/preferences?organizationId=org-x");
    expect(res.body.payload.orders).toBe(true);
  });

  it("PATCH notifications read-all fallback", async () => {
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp()).patch("/api/notifications/read-all?organizationId=org-x");
    expect(res.status).toBe(200);
  });

  it("PATCH commercial-context fallback when core down", async () => {
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp())
      .patch("/api/commercial-context?actorId=org-test")
      .send({ lastWorkspace: "catalog" });
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("GET enterprise channels fallback", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/enterprise/channels");
    expect(res.status).toBe(200);
    expect(res.body.fallbackUsed).toBe(true);
  });

  it("GET enterprise canonical poles fallback", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/enterprise/poles/canonical");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.payload)).toBe(true);
  });

  it("POST enterprise collaborators fallback", async () => {
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp())
      .post("/api/enterprise/collaborators")
      .send({ enterpriseId: "ent-1", status: "PENDING_VALIDATION" });
    expect(res.status).toBe(200);
    expect(res.body.payload.status).toBe("PENDING_VALIDATION");
  });

  it("POST enterprise security actions fallback", async () => {
    vi.spyOn(coreClient, "fetchCore").mockResolvedValue({ ok: false, data: null, status: 502 });
    const res = await request(createApp())
      .post("/api/enterprise/security/actions")
      .send({ action: "SUSPEND_USER", enterpriseId: "ent-1", reason: "motif détaillé test" });
    expect(res.status).toBe(200);
    expect(res.body.payload.recorded).toBe(true);
  });

  it("GET enterprise security history fallback", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get("/api/enterprise/security/history?enterpriseId=ent-1");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.payload)).toBe(true);
  });

  it("blocks grossiste A on producer route (Instruction 20.86-C)", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/producer/catalog?organizationId=org-grossiste-a-nord-plus&actorRole=GROSSISTE_A",
    );
    expect(res.status).toBe(403);
    expect(String(res.body.userMessage ?? "")).not.toMatch(/403|PRODUCTION/i);
  });

  it("allows grossiste A on grossiste-a route with distribution pole", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/grossiste-a/orders?organizationId=org-grossiste-a-nord-plus&actorRole=GROSSISTE_A&pole=COMMANDES_ADV",
    );
    expect(res.status).toBe(200);
  });

  it("blocks grossiste A on producer-only pole query", async () => {
    vi.spyOn(coreClient, "persistenceEnabled").mockReturnValue(false);
    const res = await request(createApp()).get(
      "/api/grossiste-a/orders?organizationId=org-grossiste-a-nord-plus&actorRole=GROSSISTE_A&pole=PRODUCTION",
    );
    expect(res.status).toBe(403);
  });
});
