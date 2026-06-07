import type { Express } from "express";

import { completeGrossisteBOnboarding } from "./grossiste-b-onboarding.service.js";

export function registerGrossisteBOnboardingRoutes(app: Express) {
  app.post("/api/grossiste-b/onboarding/complete", async (req, res) => {
    const result = await completeGrossisteBOnboarding({
      phone: String(req.body?.phone ?? ""),
      registrationToken: req.body?.registrationToken
        ? String(req.body.registrationToken)
        : undefined,
      displayName: String(req.body?.displayName ?? ""),
      activities: Array.isArray(req.body?.activities) ? req.body.activities.map(String) : [],
      city: String(req.body?.city ?? ""),
      devBypassOtp: req.body?.devBypassOtp === true,
    });

    if (!result.ok) {
      const status = result.code === "otp_not_verified" ? 401 : 400;
      res.status(status).json({
        ok: false,
        code: result.code,
        userMessage: result.userMessage,
      });
      return;
    }

    res.json({
      ok: true,
      organizationId: result.organizationId,
      profile: result.profile,
    });
  });
}
