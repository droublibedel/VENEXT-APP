import type { Express, Request, Response } from "express";

import {
  envelopeForMode,
  resolveCommerceFallbackMode,
  resolvePersistenceAvailability,
} from "./commerce-fallback-resolver.js";
import { fetchCore, persistenceEnabled } from "./core-client.js";
import { createCommerceAccessMiddleware } from "./commerce-access-middleware.js";
import { createEndpointAccessGuard } from "./commerce-access-endpoint-guard.js";
import { createGrossisteASeparationMiddleware } from "./grossiste-a-pole-guard.js";
import {
  FALLBACK_GROSSISTE_A_CATALOG,
  FALLBACK_GROSSISTE_CATALOG,
  FALLBACK_PRODUCER_CATALOG,
  FALLBACK_WALLET_BALANCE,
  fallbackEnvelope,
  liveEnvelope,
} from "./fallback-envelopes.js";
import { registerBackofficeRoutes } from "./backoffice-routes.js";
import { registerBackofficeLiveRoutes } from "./backoffice-live-routes.js";
import { shapeBffEnvelope } from "./lightweight-response.js";
import {
  bffCreateTerrainAudio,
  bffDeleteTerrainAudio,
  bffGetProductAudio,
  bffGetProfileAudio,
  bffGetTerrainAudio,
  bffPartnerSuggestions,
} from "./terrain-audio/terrain-audio-store.js";

function maybeShapeListEnvelope(body: unknown, maxItems?: number): unknown {
  if (!maxItems || !body || typeof body !== "object") return body;
  const row = body as { payload?: unknown; dataSource?: "live" | "fallback" | "mixed"; fallbackUsed?: boolean };
  if (!Array.isArray(row.payload)) return body;
  const shaped = shapeBffEnvelope(row.payload, row.dataSource ?? "live", {
    fallbackUsed: row.fallbackUsed,
    maxItems,
  });
  return { ...row, ...shaped };
}

async function proxyCore<T>(
  res: Response,
  path: string,
  fallback: () => T,
  opts: { bffRoutesEnabled?: boolean; maxListItems?: number } = {},
) {
  const bffRoutesEnabled = opts.bffRoutesEnabled !== false;
  const persistence = resolvePersistenceAvailability();

  if (!persistenceEnabled() || !bffRoutesEnabled) {
    const mode = resolveCommerceFallbackMode({ bffRoutesEnabled, coreReachable: false, persistence });
    res.json(maybeShapeListEnvelope(envelopeForMode(mode, null, fallback()), opts.maxListItems));
    return;
  }

  const upstream = await fetchCore<{ dataSource: string; fallbackUsed: boolean; payload: T }>(path);
  const mode = resolveCommerceFallbackMode({
    bffRoutesEnabled,
    coreReachable: upstream.ok,
    persistence,
  });

  if (mode === "LIVE" && upstream.ok && upstream.data) {
    res.json(maybeShapeListEnvelope(upstream.data, opts.maxListItems));
    return;
  }

  if (mode === "HYBRID" && upstream.ok && upstream.data) {
    res.json(
      maybeShapeListEnvelope(
        {
          ...upstream.data,
          fallbackUsed: true,
          dataSource: "mixed",
          devBadge: true,
        },
        opts.maxListItems,
      ),
    );
    return;
  }

  res.json(maybeShapeListEnvelope(envelopeForMode("FALLBACK", null, fallback()), opts.maxListItems));
}

export function registerRoutes(app: Express) {
  registerBackofficeRoutes(app);
  registerBackofficeLiveRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "commerce-bff",
      persistence: resolvePersistenceAvailability(),
    });
  });

  app.get("/api/feature-flags", async (_req, res) => {
    await proxyCore(res, "/commerce-foundation/feature-flags", () => [
      { key: "venext_backend_persistence_enabled", enabled: true, environment: "development" },
      { key: "venext_bff_routes_enabled", enabled: true, environment: "development" },
      { key: "venext_live_data_fallback_enabled", enabled: true, environment: "development" },
    ]);
  });

  const guardActorEndpoint = createEndpointAccessGuard();
  const guardGrossisteASeparation = createGrossisteASeparationMiddleware();

  app.get("/api/grossiste-b/:endpoint", guardActorEndpoint, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-grossiste-b-demo");
    const endpoint = req.params.endpoint;
    await proxyCore(
      res,
      `/commerce-foundation/grossiste-b/${endpoint}?organizationId=${encodeURIComponent(org)}`,
      () => (endpoint === "catalog" ? FALLBACK_GROSSISTE_CATALOG : { organizationId: org }),
    );
  });

  app.get("/api/grossiste-a/:endpoint", guardGrossisteASeparation, guardActorEndpoint, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-grossiste-a-nord-plus");
    const endpoint = req.params.endpoint;
    await proxyCore(
      res,
      `/commerce-foundation/grossiste-a/${endpoint}?organizationId=${encodeURIComponent(org)}`,
      () => (endpoint === "catalog" ? FALLBACK_GROSSISTE_A_CATALOG : { organizationId: org }),
    );
  });

  app.get("/api/producer/:endpoint", guardGrossisteASeparation, guardActorEndpoint, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-producer-agronexus-ci");
    const endpoint = req.params.endpoint;
    await proxyCore(
      res,
      `/commerce-foundation/producer/${endpoint}?organizationId=${encodeURIComponent(org)}`,
      () => (endpoint === "catalog" ? FALLBACK_PRODUCER_CATALOG : { organizationId: org }),
    );
  });

  app.get("/api/detaillant/:endpoint", guardActorEndpoint, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-detaillant-yopougon");
    const endpoint = req.params.endpoint;
    await proxyCore(
      res,
      `/commerce-foundation/detaillant/${endpoint}?organizationId=${encodeURIComponent(org)}`,
      () => ({ organizationId: org }),
    );
  });

  const guardCatalog = createCommerceAccessMiddleware("relational_catalog");
  const guardOrder = createCommerceAccessMiddleware("order");
  const guardWallet = createCommerceAccessMiddleware("wallet");
  const guardMessaging = createCommerceAccessMiddleware("messaging");
  const guardMail = createCommerceAccessMiddleware("mail");
  const guardSettlement = createCommerceAccessMiddleware("settlement");
  const guardNotifications = createCommerceAccessMiddleware("notifications");
  const guardActivity = createCommerceAccessMiddleware("activity_feed");
  const guardOffline = createCommerceAccessMiddleware("offline_cache");

  app.get("/api/commerce-wallet/:endpoint", guardWallet, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-grossiste-b-demo");
    const endpoint = req.params.endpoint;
    await proxyCore(
      res,
      `/commerce-foundation/commerce-wallet/${endpoint}?organizationId=${encodeURIComponent(org)}`,
      () => (endpoint === "balance" ? FALLBACK_WALLET_BALANCE : []),
    );
  });

  app.get("/api/actors/me", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    await proxyCore(res, `/commerce-foundation/actors/me?organizationId=${encodeURIComponent(org)}`, () => ({
      id: "profile-fallback",
      actorRole: "GROSSISTE_B",
      displayName: "Démo terrain",
      organizationId: org,
    }));
  });

  app.get("/api/relationships", async (req, res) => {
    const org = req.query.organizationId ? String(req.query.organizationId) : "";
    const qs = org ? `?organizationId=${encodeURIComponent(org)}` : "";
    await proxyCore(res, `/commerce-foundation/relationships${qs}`, () => []);
  });

  app.get("/api/commercial-orders", guardOrder, async (req, res) => {
    const org = req.query.organizationId ? String(req.query.organizationId) : "";
    const qs = org ? `?organizationId=${encodeURIComponent(org)}` : "";
    await proxyCore(res, `/commerce-foundation/commercial-orders${qs}`, () => []);
  });

  app.get("/api/commercial-context", async (req, res) => {
    const actorId = String(req.query.actorId ?? "");
    await proxyCore(
      res,
      `/commerce-foundation/commercial-context?actorId=${encodeURIComponent(actorId)}`,
      () => ({ actorId, activeContext: {}, history: [], lastWorkspace: "home" }),
    );
  });

  app.patch("/api/commercial-context", async (req, res) => {
    const actorId = String(req.query.actorId ?? "");
    const upstream = await fetchCore<Record<string, unknown>>(
      `/commerce-foundation/commercial-context?actorId=${encodeURIComponent(actorId)}`,
      { method: "PATCH", body: JSON.stringify(req.body) },
    );
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ actorId, ...req.body }));
  });

  app.get("/api/relational-catalogs", guardCatalog, async (req, res) => {
    const org = req.query.organizationId ? String(req.query.organizationId) : "";
    const rel = req.query.relationshipId ? String(req.query.relationshipId) : "";
    const qs = new URLSearchParams();
    if (org) qs.set("organizationId", org);
    if (rel) qs.set("relationshipId", rel);
    const q = qs.toString() ? `?${qs}` : "";
    await proxyCore(res, `/commerce-foundation/relational-catalogs${q}`, () => []);
  });

  app.get("/api/commercial-deliveries", guardOrder, async (req, res) => {
    const rel = req.query.relationshipId ? String(req.query.relationshipId) : "";
    const qs = rel ? `?relationshipId=${encodeURIComponent(rel)}` : "";
    await proxyCore(res, `/commerce-foundation/commercial-deliveries${qs}`, () => []);
  });

  app.get("/api/commercial-settlements", guardSettlement, async (req, res) => {
    const org = req.query.organizationId ? String(req.query.organizationId) : "";
    const qs = org ? `?organizationId=${encodeURIComponent(org)}` : "";
    await proxyCore(res, `/commerce-foundation/commercial-settlements${qs}`, () => []);
  });

  app.get("/api/commerce-messaging/conversations", guardMessaging, async (req, res) => {
    const rel = req.query.relationshipId ? String(req.query.relationshipId) : "";
    const qs = rel ? `?relationshipId=${encodeURIComponent(rel)}` : "";
    await proxyCore(res, `/commerce-foundation/commerce-messaging/conversations${qs}`, () => []);
  });

  app.get("/api/commerce-messaging/conversations/:conversationId/messages", guardMessaging, async (req, res) => {
    const cid = encodeURIComponent(String(req.params.conversationId));
    const rel = req.query.relationshipId ? String(req.query.relationshipId) : "";
    const qs = rel ? `?relationshipId=${encodeURIComponent(rel)}` : "";
    await proxyCore(
      res,
      `/commerce-foundation/commerce-messaging/conversations/${cid}/messages${qs}`,
      () => [],
    );
  });

  app.post("/api/commerce-messaging/conversations/:conversationId/messages", guardMessaging, async (req, res) => {
    const cid = encodeURIComponent(String(req.params.conversationId));
    const upstream = await fetchCore(`/commerce-foundation/commerce-messaging/conversations/${cid}/messages`, {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(
      liveEnvelope({
        id: `msg-${Date.now()}`,
        conversationId: req.params.conversationId,
        ...req.body,
        at: new Date().toISOString(),
        status: "sent",
      }),
    );
  });

  app.delete(
    "/api/commerce-messaging/conversations/:conversationId/messages/:messageId",
    guardMessaging,
    async (req, res) => {
      const cid = encodeURIComponent(String(req.params.conversationId));
      const mid = encodeURIComponent(String(req.params.messageId));
      const upstream = await fetchCore(
        `/commerce-foundation/commerce-messaging/conversations/${cid}/messages/${mid}`,
        { method: "DELETE" },
      );
      if (upstream.ok) {
        res.json(upstream.data ?? { deletedGlobally: true });
        return;
      }
      res.json(liveEnvelope({ deletedGlobally: true, messageId: req.params.messageId }));
    },
  );

  app.post("/api/terrain-audio", async (req, res) => {
    const body = req.body ?? {};
    const asset = bffCreateTerrainAudio({
      ownerActorId: String(body.ownerActorId ?? "org-grossiste-b-demo"),
      scopeType: body.scopeType ?? "PRODUCT_DESCRIPTION",
      scopeId: String(body.scopeId ?? "product-unknown"),
      durationSeconds: Number(body.durationSeconds ?? 1),
      mimeType: body.mimeType,
      waveformData: body.waveformData,
    });
    res.json(liveEnvelope(asset));
  });

  app.get("/api/terrain-audio/:id", async (req, res) => {
    const asset = bffGetTerrainAudio(String(req.params.id));
    if (!asset) {
      res.status(404).json(fallbackEnvelope({ message: "Audio introuvable" }));
      return;
    }
    res.json(liveEnvelope(asset));
  });

  app.delete("/api/terrain-audio/:id", async (req, res) => {
    bffDeleteTerrainAudio(String(req.params.id));
    res.json(liveEnvelope({ deleted: true, deletedAt: new Date().toISOString() }));
  });

  app.post("/api/grossiste-b/products/:productId/audio-description", async (req, res) => {
    const productId = String(req.params.productId);
    const asset = bffCreateTerrainAudio({
      ownerActorId: String(req.body?.ownerActorId ?? "org-grossiste-b-demo"),
      scopeType: "PRODUCT_DESCRIPTION",
      scopeId: productId,
      durationSeconds: Number(req.body?.durationSeconds ?? 1),
      mimeType: req.body?.mimeType,
    });
    res.json(liveEnvelope(bffGetProductAudio(productId)));
  });

  app.delete("/api/grossiste-b/products/:productId/audio-description", async (req, res) => {
    const rec = bffGetProductAudio(String(req.params.productId));
    if (rec) bffDeleteTerrainAudio(rec.id);
    res.json(liveEnvelope({ deleted: true }));
  });

  app.post("/api/grossiste-b/profile/business-audio", async (req, res) => {
    const ownerActorId = String(req.body?.ownerActorId ?? "org-grossiste-b-demo");
    bffCreateTerrainAudio({
      ownerActorId,
      scopeType: "BUSINESS_PROFILE",
      scopeId: ownerActorId,
      durationSeconds: Number(req.body?.durationSeconds ?? 1),
    });
    res.json(liveEnvelope({ ...bffGetProfileAudio(ownerActorId), optionalText: req.body?.optionalText }));
  });

  app.delete("/api/grossiste-b/profile/business-audio", async (req, res) => {
    const ownerActorId = String(req.query.ownerActorId ?? req.body?.ownerActorId ?? "org-grossiste-b-demo");
    const rec = bffGetProfileAudio(ownerActorId);
    if (rec) bffDeleteTerrainAudio(rec.id);
    res.json(liveEnvelope({ deleted: true }));
  });

  app.get("/api/partner-suggestions", async (_req, res) => {
    res.json(liveEnvelope({ suggestions: bffPartnerSuggestions() }));
  });

  app.post("/api/commercial-location", async (req, res) => {
    const { bffPostCommercialLocation } = await import("./commercial-location/commercial-location-store.js");
    try {
      const profile = await bffPostCommercialLocation(req.body ?? {});
      res.json(liveEnvelope(profile));
    } catch (e) {
      res.status(400).json(fallbackEnvelope({ error: String(e) }));
    }
  });

  app.patch("/api/commercial-location", async (req, res) => {
    const { bffPatchCommercialLocation } = await import("./commercial-location/commercial-location-store.js");
    const actorId = String(req.body?.actorId ?? "");
    const profile = bffPatchCommercialLocation(actorId, req.body ?? {});
    if (!profile) {
      res.status(404).json(fallbackEnvelope({ error: "not_found" }));
      return;
    }
    res.json(liveEnvelope(profile));
  });

  app.get("/api/commercial-location/me", async (req, res) => {
    const { bffGetCommercialLocation, bffGetCommercialLocationPublic } = await import(
      "./commercial-location/commercial-location-store.js"
    );
    const actorId = String(req.query.actorId ?? "");
    const profile = bffGetCommercialLocation(actorId);
    if (!profile) {
      res.status(404).json(fallbackEnvelope({ error: "not_found" }));
      return;
    }
    res.json(liveEnvelope({ profile, publicView: bffGetCommercialLocationPublic(actorId) }));
  });

  app.get("/api/relational-feed", async (req, res) => {
    const { resolveRelationalFeedBff } = await import("./relational-feed/relational-feed-bff-resolver.js");
    const page = resolveRelationalFeedBff({
      actorId: String(req.query.actorId ?? ""),
      role: String(req.query.role ?? "detaillant"),
      city: String(req.query.city ?? "Abidjan"),
      categories: String(req.query.categories ?? "chaussures"),
      partnerIds: String(req.query.partnerIds ?? ""),
      partnersPublished: String(req.query.partnersPublished ?? "true"),
    });
    res.json(liveEnvelope(page));
  });

  app.get("/api/professional-mail/threads", guardMail, async (req, res) => {
    const rel = req.query.relationshipId ? String(req.query.relationshipId) : "";
    const qs = rel ? `?relationshipId=${encodeURIComponent(rel)}` : "";
    await proxyCore(res, `/commerce-foundation/professional-mail/threads${qs}`, () => []);
  });

  app.post("/api/commerce-foundation/seed-demo", async (_req, res) => {
    const r = await fetchCore<{ inserted: number }>("/commerce-foundation/seed-demo", { method: "POST" });
    if (r.ok && r.data) {
      res.json(liveEnvelope(r.data));
      return;
    }
    res.status(503).json(fallbackEnvelope({ inserted: 0 }));
  });

  app.get("/api/offline/bootstrap", guardOffline, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-grossiste-b-demo");
    const actorRole = String(req.query.actorRole ?? "GROSSISTE_B");
    await proxyCore(
      res,
      `/commerce-foundation/offline/bootstrap?organizationId=${encodeURIComponent(org)}&actorRole=${encodeURIComponent(actorRole)}`,
      () => ({
        organizationId: org,
        actorRole,
        cachedAt: new Date().toISOString(),
        recentOrders: [],
        recentDeliveries: [],
        recentActivity: [],
        notifications: [],
        recentConversations: [],
        relationalCatalog: [],
        commercialContext: null,
        preferences: { locale: "fr-CI" },
      }),
    );
  });

  app.post("/api/offline/sync", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    const upstream = await fetchCore(
      `/commerce-foundation/offline/sync?organizationId=${encodeURIComponent(org)}`,
      { method: "POST", body: JSON.stringify(req.body ?? {}) },
    );
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ synced: true, organizationId: org }));
  });

  app.post("/api/offline/replay", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    const upstream = await fetchCore(
      `/commerce-foundation/offline/replay?organizationId=${encodeURIComponent(org)}`,
      { method: "POST", body: JSON.stringify(req.body ?? {}) },
    );
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ replayed: 0, conflicts: [], organizationId: org }));
  });

  app.get("/api/activity-feed", guardActivity, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-grossiste-b-demo");
    await proxyCore(
      res,
      `/commerce-foundation/activity-feed?organizationId=${encodeURIComponent(org)}`,
      () => [],
      { maxListItems: 50 },
    );
  });

  app.get("/api/activity-feed/summary", async (req, res) => {
    const org = String(req.query.organizationId ?? "org-grossiste-b-demo");
    await proxyCore(
      res,
      `/commerce-foundation/activity-feed/summary?organizationId=${encodeURIComponent(org)}`,
      () => ({
        organizationId: org,
        totalToday: 0,
        ordersToday: 0,
        deliveriesToday: 0,
        partnersActive: 0,
        headlineKey: "activity.summary.quiet",
      }),
    );
  });

  app.patch("/api/activity-feed/:id/read", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    const id = req.params.id;
    const upstream = await fetchCore(
      `/commerce-foundation/activity-feed/${encodeURIComponent(id)}/read?organizationId=${encodeURIComponent(org)}`,
      { method: "PATCH" },
    );
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ id, read: true }));
  });

  app.get("/api/notifications", guardNotifications, async (req, res) => {
    const org = String(req.query.organizationId ?? "org-grossiste-b-demo");
    await proxyCore(
      res,
      `/commerce-foundation/notifications?organizationId=${encodeURIComponent(org)}`,
      () => [],
      { maxListItems: 40 },
    );
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    const id = req.params.id;
    const upstream = await fetchCore(
      `/commerce-foundation/notifications/${encodeURIComponent(id)}/read?organizationId=${encodeURIComponent(org)}`,
      { method: "PATCH" },
    );
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ id, read: true }));
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    const upstream = await fetchCore(
      `/commerce-foundation/notifications/read-all?organizationId=${encodeURIComponent(org)}`,
      { method: "PATCH" },
    );
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ updated: 0 }));
  });

  app.get("/api/notifications/preferences", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    await proxyCore(
      res,
      `/commerce-foundation/notifications/preferences?organizationId=${encodeURIComponent(org)}`,
      () => ({
        orders: true,
        deliveries: true,
        settlements: true,
        messages: true,
        mails: true,
        relations: true,
        catalogs: true,
        walletSecurity: true,
        sponsoredCatalogs: false,
      }),
    );
  });

  app.patch("/api/notifications/preferences", async (req, res) => {
    const org = String(req.query.organizationId ?? "");
    const upstream = await fetchCore(
      `/commerce-foundation/notifications/preferences?organizationId=${encodeURIComponent(org)}`,
      { method: "PATCH", body: JSON.stringify(req.body) },
    );
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope(req.body));
  });

  app.post("/api/commerce-foundation/reset-demo", async (_req, res) => {
    const r = await fetchCore<{ deleted: number }>("/commerce-foundation/reset-demo", { method: "POST" });
    if (r.ok && r.data) {
      res.json(liveEnvelope(r.data));
      return;
    }
    res.json(fallbackEnvelope({ deleted: 0 }));
  });

  app.get("/api/enterprise/channels", async (_req, res) => {
    await proxyCore(res, "/commerce-foundation/enterprise/channels", () => []);
  });

  app.post("/api/enterprise/channels", async (req, res) => {
    const upstream = await fetchCore("/commerce-foundation/enterprise/channels", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope(req.body ?? {}));
  });

  app.get("/api/enterprise/poles/canonical", async (_req, res) => {
    await proxyCore(res, "/commerce-foundation/enterprise/poles/canonical", () => [
      "executive",
      "commercial",
      "industrial-security",
    ]);
  });

  app.get("/api/enterprise/activation-queue", async (_req, res) => {
    await proxyCore(res, "/commerce-foundation/enterprise/activation-queue", () => []);
  });

  app.post("/api/enterprise/collaborators", async (req, res) => {
    const upstream = await fetchCore("/commerce-foundation/enterprise/collaborators", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ status: "PENDING_VALIDATION", ...req.body }));
  });

  app.post("/api/enterprise/security/actions", async (req, res) => {
    const upstream = await fetchCore("/commerce-foundation/enterprise/security/actions", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
    if (upstream.ok && upstream.data) {
      res.json(upstream.data);
      return;
    }
    res.json(fallbackEnvelope({ recorded: true, ...req.body }));
  });

  app.get("/api/enterprise/security/history", async (req, res) => {
    const enterpriseId = String(req.query.enterpriseId ?? "");
    await proxyCore(
      res,
      `/commerce-foundation/enterprise/security/history?enterpriseId=${encodeURIComponent(enterpriseId)}`,
      () => [],
    );
  });

  app.get("/api/enterprise/security/alerts", async (req, res) => {
    const enterpriseId = String(req.query.enterpriseId ?? "");
    await proxyCore(
      res,
      `/commerce-foundation/enterprise/security/alerts?enterpriseId=${encodeURIComponent(enterpriseId)}`,
      () => [],
    );
  });
}
