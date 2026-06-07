import type { Express } from "express";

import {
  getTerrainProfileIdentity,
  markOfflineCacheUsed,
  setCurrentTerrainProfile,
  switchTerrainProfileIdentity,
  toClientIdentityResponse,
} from "./terrain-profile-identity.service.js";
import {
  guardTerrainProfileSwitchRequest,
  setServerProfileSessionVersion,
} from "./terrain-profile-context.guard.js";

export function registerTerrainProfileRoutes(app: Express) {
  app.get("/api/terrain/profile-identity", async (req, res) => {
    const userKey = String(req.query.userKey ?? "").trim();
    if (!userKey) {
      res.status(400).json({ ok: false, code: "missing_user_key" });
      return;
    }
    const identity = await getTerrainProfileIdentity(userKey);
    res.json({
      ok: true,
      source: "backend",
      identity: identity ? toClientIdentityResponse(identity) : null,
    });
  });

  app.put("/api/terrain/profile-identity/current-profile", async (req, res) => {
    const userKey = String(req.body?.userKey ?? "").trim();
    const currentActiveProfile = String(req.body?.currentActiveProfile ?? "").trim();
    if (!userKey || !currentActiveProfile) {
      res.status(400).json({ ok: false, code: "invalid_payload" });
      return;
    }
    const result = await setCurrentTerrainProfile({
      userKey,
      currentActiveProfile,
      primaryProfile: req.body?.primaryProfile ? String(req.body.primaryProfile) : null,
      deviceId: req.body?.deviceId ? String(req.body.deviceId) : undefined,
      source: req.body?.source ? String(req.body.source) : "onboarding",
    });
    if (!result.ok) {
      res.status(result.code === "invalid_user" ? 400 : 403).json(result);
      return;
    }
    res.json({ ok: true, identity: toClientIdentityResponse(result.identity), runtimeContext: result.identity.permissions });
  });

  app.post("/api/terrain/profile-identity/switch", async (req, res) => {
    const userKey = String(req.body?.userKey ?? "").trim();
    const targetProfile = String(req.body?.targetProfile ?? req.body?.currentActiveProfile ?? "").trim();
    if (!userKey || !targetProfile) {
      res.status(400).json({ ok: false, code: "invalid_payload" });
      return;
    }
    const headerGuard = guardTerrainProfileSwitchRequest(req, userKey);
    if (!headerGuard.ok) {
      res.status(headerGuard.status).json({
        ok: false,
        code: headerGuard.code,
        message: headerGuard.message,
      });
      return;
    }
    const result = await switchTerrainProfileIdentity({
      userKey,
      targetProfile,
      deviceId: req.body?.deviceId ? String(req.body.deviceId) : undefined,
      switchReason: req.body?.switchReason ? String(req.body.switchReason) : undefined,
      clientVersion: typeof req.body?.clientVersion === "number" ? req.body.clientVersion : undefined,
    });
    if (!result.ok) {
      const status = result.code === "identity_not_found" ? 404 : 403;
      res.status(status).json(result);
      return;
    }
    setServerProfileSessionVersion(userKey, result.identity.activeProfileVersion);
    res.json({
      ok: true,
      identity: toClientIdentityResponse(result.identity),
      runtimeContext: result.identity.permissions,
      conflictResolved: result.conflictResolved,
    });
  });

  /** Legacy — rejects blind client upserts; use current-profile or switch */
  app.put("/api/terrain/profile-identity", async (_req, res) => {
    res.status(410).json({
      ok: false,
      code: "use_backend_endpoints",
      message: "Utilisez PUT /current-profile ou POST /switch",
    });
  });

  app.post("/api/terrain/profile-identity/offline-cache", async (req, res) => {
    const userKey = String(req.body?.userKey ?? "").trim();
    if (userKey) markOfflineCacheUsed(userKey);
    res.json({ ok: true, cachedProfile: true });
  });
}
