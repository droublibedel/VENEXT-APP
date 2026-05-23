import type { Express, Request, Response } from "express";
import {
  ingestLiveBlockageEvents,
  ingestLiveErrorEvents,
  ingestLiveJourneyEvents,
  ingestLiveOperationalEvents,
  resolveBackofficePersistenceMode,
} from "backoffice-operational";

const TELEMETRY_KEY = process.env.VENEXT_LIVE_TELEMETRY_KEY ?? "dev-live-telemetry";

function validateTelemetry(req: Request, res: Response): boolean {
  if (req.headers["x-venext-live-telemetry"] !== "1") {
    res.status(400).json({ code: "live_telemetry_required" });
    return false;
  }
  const key = req.headers["x-venext-telemetry-key"];
  if (TELEMETRY_KEY && key !== TELEMETRY_KEY) {
    res.status(403).json({ code: "invalid_telemetry_key" });
    return false;
  }
  return true;
}

function liveMeta(res: Response, accepted: number) {
  const mode = resolveBackofficePersistenceMode();
  return res.json({
    accepted,
    persistenceMode: mode,
    dataSource: mode === "FALLBACK" ? "FALLBACK" : "LIVE",
    fallbackUsed: mode === "FALLBACK",
  });
}

export function registerBackofficeLiveRoutes(app: Express) {
  app.post("/api/backoffice/live/error", async (req, res) => {
    if (!validateTelemetry(req, res)) return;
    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    const accepted = await ingestLiveErrorEvents(events);
    res.json({ accepted, persistenceMode: resolveBackofficePersistenceMode() });
  });

  app.post("/api/backoffice/live/journey", async (req, res) => {
    if (!validateTelemetry(req, res)) return;
    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    const accepted = await ingestLiveJourneyEvents(events);
    return liveMeta(res, accepted);
  });

  app.post("/api/backoffice/live/operational", async (req, res) => {
    if (!validateTelemetry(req, res)) return;
    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    const accepted = await ingestLiveOperationalEvents(events);
    return liveMeta(res, accepted);
  });

  app.post("/api/backoffice/live/blockage", async (req, res) => {
    if (!validateTelemetry(req, res)) return;
    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    const accepted = await ingestLiveBlockageEvents(events);
    return liveMeta(res, accepted);
  });
}
