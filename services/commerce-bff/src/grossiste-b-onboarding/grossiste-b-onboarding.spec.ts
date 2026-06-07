import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

import { registerGrossisteBOnboardingRoutes } from "./grossiste-b-onboarding.routes.js";
import * as onboardingService from "./grossiste-b-onboarding.service.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerGrossisteBOnboardingRoutes(app);
  return app;
}

describe("grossiste B onboarding routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns profile payload on successful registration", async () => {
    vi.spyOn(onboardingService, "completeGrossisteBOnboarding").mockResolvedValue({
      ok: true,
      organizationId: "org-grossiste-b-701020304",
      profile: { displayName: "Moussa" },
    });

    const res = await request(createApp()).post("/api/grossiste-b/onboarding/complete").send({
      phone: "+2250701020304",
      registrationToken: "token-1",
      displayName: "Moussa",
      activities: ["Sucre"],
      city: "Abidjan",
    });

    expect(res.status).toBe(200);
    expect(res.body.organizationId).toBe("org-grossiste-b-701020304");
  });

  it("returns 401 when otp is not verified", async () => {
    vi.spyOn(onboardingService, "completeGrossisteBOnboarding").mockResolvedValue({
      ok: false,
      code: "otp_not_verified",
      userMessage: "Vérifiez votre numéro.",
    });

    const res = await request(createApp()).post("/api/grossiste-b/onboarding/complete").send({
      phone: "+2250701020304",
      displayName: "Moussa",
      activities: [],
      city: "Abidjan",
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("otp_not_verified");
  });
});
