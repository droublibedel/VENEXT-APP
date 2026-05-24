import type { Express } from "express";

import { fetchCore } from "../core-client.js";
import { liveEnvelope } from "../fallback-envelopes.js";

export function registerTerrainSearchRoutes(app: Express) {
  app.get("/api/terrain/search", async (req, res) => {
    const q = String(req.query.q ?? "");
    const organizationId = String(req.query.organizationId ?? "");
    const actorRole = String(req.query.role ?? req.query.actorRole ?? "DETAILLANT");
    const qs = new URLSearchParams({
      q,
      organizationId,
      actorRole,
    });
    const upstream = await fetchCore<{ payload: { query: string; results: unknown[] } }>(
      `/commerce-foundation/terrain/search?${qs.toString()}`,
    );
    if (!upstream.ok || !upstream.data?.payload) {
      res.status(upstream.status || 502).json({ ok: false, query: q, results: [] });
      return;
    }
    res.json(liveEnvelope(upstream.data.payload));
  });
}
