import type { Express } from "express";

import { loginTerrainSession } from "./terrain-login.service.js";

export function registerTerrainLoginRoutes(app: Express) {
  app.post("/api/auth/terrain/login", async (req, res) => {
    const actorRole = String(req.body?.actorRole ?? "DETAILLANT").toUpperCase() as
      | "DETAILLANT"
      | "GROSSISTE_B";
    const result = await loginTerrainSession({
      phone: String(req.body?.phone ?? ""),
      registrationToken: req.body?.registrationToken ? String(req.body.registrationToken) : undefined,
      actorRole: actorRole === "GROSSISTE_B" ? "GROSSISTE_B" : "DETAILLANT",
      devBypassOtp: req.body?.devBypassOtp === true,
    });
    if (!result.ok) {
      const status = result.code === "account_not_found" ? 404 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  });
}
