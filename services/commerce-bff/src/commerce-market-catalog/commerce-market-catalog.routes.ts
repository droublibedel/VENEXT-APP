import type { Express } from "express";

import { fetchCore } from "../core-client.js";
import { assertCatalogueAccess, assertMarketAccess } from "commerce-economic-lanes";

async function proxyMarketCatalog(
  res: import("express").Response,
  path: string,
  fallback: () => unknown,
) {
  const upstream = await fetchCore(path);
  if (upstream?.ok) {
    res.json({ ok: true, dataSource: "live", fallbackUsed: false, payload: upstream.data });
    return;
  }
  res.json({ ok: true, dataSource: "fallback", fallbackUsed: true, payload: fallback() });
}

export function registerCommerceMarketCatalogRoutes(app: Express) {
  app.get("/api/catalogue/my-products", async (req, res) => {
    const organizationId = String(req.query.organizationId ?? "");
    const actorRole = String(req.query.actorRole ?? "GROSSISTE_B");
    const access = assertCatalogueAccess(actorRole);
    if (!access.allowed) {
      res.status(403).json({ ok: false, code: access.code });
      return;
    }
    await proxyMarketCatalog(
      res,
      `/commerce-market-catalog/catalogue/my-products?organizationId=${encodeURIComponent(organizationId)}&actorRole=${encodeURIComponent(actorRole)}`,
      () => ({ organizationId, lane: "catalogue", products: [] }),
    );
  });

  app.get("/api/market/feed", async (req, res) => {
    const organizationId = String(req.query.organizationId ?? "");
    const actorRole = String(req.query.actorRole ?? "DETAILLANT");
    const access = assertMarketAccess(actorRole);
    if (!access.allowed) {
      res.status(403).json({ ok: false, code: access.code });
      return;
    }
    await proxyMarketCatalog(
      res,
      `/commerce-market-catalog/market/feed?organizationId=${encodeURIComponent(organizationId)}&actorRole=${encodeURIComponent(actorRole)}`,
      () => ({ organizationId, lane: "market", products: [] }),
    );
  });

  app.get("/api/market/product/:id", async (req, res) => {
    const organizationId = String(req.query.organizationId ?? "");
    const actorRole = String(req.query.actorRole ?? "DETAILLANT");
    await proxyMarketCatalog(
      res,
      `/commerce-market-catalog/market/product/${encodeURIComponent(req.params.id)}?organizationId=${encodeURIComponent(organizationId)}&actorRole=${encodeURIComponent(actorRole)}`,
      () => ({ organizationId, lane: "market", product: null }),
    );
  });

  app.get("/api/catalogue/product/:id", async (req, res) => {
    const organizationId = String(req.query.organizationId ?? "");
    const actorRole = String(req.query.actorRole ?? "GROSSISTE_B");
    await proxyMarketCatalog(
      res,
      `/commerce-market-catalog/catalogue/product/${encodeURIComponent(req.params.id)}?organizationId=${encodeURIComponent(organizationId)}&actorRole=${encodeURIComponent(actorRole)}`,
      () => ({ organizationId, lane: "catalogue", product: null }),
    );
  });

  app.post("/api/market/products/:id/transfer", async (req, res) => {
    const organizationId = String(req.body?.organizationId ?? "");
    const actorRole = String(req.body?.actorRole ?? "GROSSISTE_B");
    const access = assertCatalogueAccess(actorRole);
    if (!access.allowed) {
      res.status(403).json({ ok: false, code: access.code });
      return;
    }
    const upstream = await fetchCore(
      `/commerce-market-catalog/market/products/${encodeURIComponent(req.params.id)}/transfer`,
      {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          actorRole,
          userKey: req.body?.userKey,
        }),
      },
    );
    if (upstream.ok && upstream.data && typeof upstream.data === "object") {
      res.json({ ok: true, ...(upstream.data as Record<string, unknown>) });
      return;
    }
    res.status(upstream.status ?? 502).json({ ok: false, code: "transfer_failed" });
  });
}
