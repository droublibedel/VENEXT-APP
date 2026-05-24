import type { Express } from "express";

import { requestTerrainOtp, verifyTerrainOtpCode } from "./terrain-otp.service.js";

export function registerTerrainOtpRoutes(app: Express) {
  app.post("/api/auth/terrain/request-otp", async (req, res) => {
    const phone = String(req.body?.phone ?? "");
    const result = await requestTerrainOtp(phone);
    if (!result.ok) {
      res.status(result.code === "rate_limited" ? 429 : 400).json({
        ok: false,
        code: result.code,
        userMessage: result.userMessage,
        retryAfterSeconds: result.retryAfterSeconds,
      });
      return;
    }

    res.json({
      ok: true,
      destinationHint: result.destinationHint,
      expiresInSeconds: result.expiresInSeconds,
      delivery: result.delivery,
    });
  });

  app.post("/api/auth/terrain/verify-otp", (req, res) => {
    const phone = String(req.body?.phone ?? "");
    const code = String(req.body?.code ?? "");
    const result = verifyTerrainOtpCode(phone, code);
    if (!result.ok) {
      res.status(400).json({
        ok: false,
        code: result.code,
        userMessage: result.userMessage,
      });
      return;
    }

    res.json({
      ok: true,
      verified: true,
      destinationHint: result.recipient.slice(-4),
      registrationToken: result.registrationToken,
    });
  });
}
