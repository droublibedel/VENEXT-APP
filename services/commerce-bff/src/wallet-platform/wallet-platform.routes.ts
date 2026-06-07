import type { Express, Request, Response } from "express";

import { fetchCore, persistenceEnabled } from "../core-client.js";
import { createCommerceAccessMiddleware } from "../commerce-access-middleware.js";
import { fallbackEnvelope } from "../fallback-envelopes.js";

const guardWallet = createCommerceAccessMiddleware("wallet");

async function proxyWallet(
  res: Response,
  path: string,
  init?: RequestInit,
  fallback?: () => unknown,
) {
  if (!persistenceEnabled()) {
    res.status(503).json(fallbackEnvelope(fallback?.() ?? { ok: false }));
    return;
  }
  const upstream = await fetchCore(path, init);
  if (upstream.ok && upstream.data) {
    res.json(upstream.data);
    return;
  }
  res.status(upstream.status || 502).json(
    fallbackEnvelope(fallback?.() ?? { ok: false, code: "upstream_error" }),
  );
}

export function registerWalletPlatformRoutes(app: Express) {
  app.get("/api/wallet/me", guardWallet, async (req, res) => {
    const organizationId = String(req.query.organizationId ?? "");
    const deviceId = req.query.deviceId ? String(req.query.deviceId) : "";
    const qs = new URLSearchParams({ organizationId });
    if (deviceId) qs.set("deviceId", deviceId);
    await proxyWallet(res, `/wallet/me?${qs}`, undefined, () => ({
      organizationId,
      balanceFcfa: 0,
      kycStatus: "PENDING",
      walletActivated: false,
      locked: false,
      biometricEnabled: false,
      featureFlags: {},
      activeSessions: [],
    }));
  });

  app.post("/api/wallet/activate", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/activate", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });

  app.post("/api/wallet/kyc/upload", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/kyc/upload", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });

  app.get("/api/wallet/transactions", guardWallet, async (req, res) => {
    const organizationId = String(req.query.organizationId ?? "");
    await proxyWallet(res, `/wallet/transactions?organizationId=${encodeURIComponent(organizationId)}`, undefined, () => []);
  });

  app.post("/api/wallet/topup", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/topup", { method: "POST", body: JSON.stringify(req.body ?? {}) });
  });

  app.post("/api/wallet/lock", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/lock", { method: "POST", body: JSON.stringify(req.body ?? {}) });
  });

  app.post("/api/wallet/unlock", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/unlock", { method: "POST", body: JSON.stringify(req.body ?? {}) });
  });

  app.post("/api/wallet/biometric/enable", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/biometric/enable", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });

  app.post("/api/wallet/biometric/disable", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/biometric/disable", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });

  app.post("/api/wallet/security/pin", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/security/pin", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });

  app.post("/api/wallet/security/inactivity-lock", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/security/inactivity-lock", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });

  app.post("/api/wallet/security/touch", guardWallet, async (req, res) => {
    await proxyWallet(res, "/wallet/security/touch", {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });

  app.post("/api/wallet/sessions/:deviceId/revoke", guardWallet, async (req, res) => {
    const deviceId = String(req.params.deviceId ?? "");
    await proxyWallet(res, `/wallet/sessions/${encodeURIComponent(deviceId)}/revoke`, {
      method: "POST",
      body: JSON.stringify(req.body ?? {}),
    });
  });
}
