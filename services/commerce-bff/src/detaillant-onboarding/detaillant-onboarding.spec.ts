import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

import { registerDetaillantOnboardingRoutes } from "./detaillant-onboarding.routes.js";
import * as onboardingService from "./detaillant-onboarding.service.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerDetaillantOnboardingRoutes(app);
  return app;
}

describe("detaillant onboarding routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns profile payload on successful registration", async () => {
    vi.spyOn(onboardingService, "completeDetaillantOnboarding").mockResolvedValue({
      ok: true,
      organizationId: "org-detaillant-701020304",
      profile: { displayName: "Aminata" },
    });

    const res = await request(createApp()).post("/api/detaillant/onboarding/complete").send({
      phone: "+2250701020304",
      registrationToken: "token-1",
      displayName: "Aminata",
      activities: ["Boissons"],
      city: "Abidjan",
    });

    expect(res.status).toBe(200);
    expect(res.body.organizationId).toBe("org-detaillant-701020304");
  });

  it("returns 401 when otp is not verified", async () => {
    vi.spyOn(onboardingService, "completeDetaillantOnboarding").mockResolvedValue({
      ok: false,
      code: "otp_not_verified",
      userMessage: "Vérifiez votre numéro.",
    });

    const res = await request(createApp()).post("/api/detaillant/onboarding/complete").send({
      phone: "+2250701020304",
      displayName: "Aminata",
      activities: [],
      city: "Abidjan",
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("otp_not_verified");
  });
});
