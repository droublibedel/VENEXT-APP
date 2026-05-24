import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

import { registerTerrainOtpRoutes } from "./terrain-otp.routes.js";
import { peekTerrainOtpForTests, resetTerrainOtpStoreForTests } from "./terrain-otp-store.js";
import { resetTerrainRegistrationStoreForTests } from "./terrain-registration-store.js";
import { normalizeCiPhone } from "./phone-normalize.js";

function createApp() {
  const app = express();
  app.use(express.json());
  registerTerrainOtpRoutes(app);
  return app;
}

describe("terrain OTP routes (Yellika)", () => {
  beforeEach(() => {
    resetTerrainOtpStoreForTests();
    resetTerrainRegistrationStoreForTests();
    delete process.env.YELLIKA_SMS_TOKEN;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetTerrainOtpStoreForTests();
    resetTerrainRegistrationStoreForTests();
  });

  it("request-otp validates phone", async () => {
    const res = await request(createApp())
      .post("/api/auth/terrain/request-otp")
      .send({ phone: "123" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("invalid_phone");
  });

  it("request-otp dev mode without Yellika token", async () => {
    const res = await request(createApp())
      .post("/api/auth/terrain/request-otp")
      .send({ phone: "+2250701020304" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.delivery).toBe("dev_log");
    expect(res.body.destinationHint).toMatch(/\*\*\*/);
  });

  it("verify-otp accepts valid code after request", async () => {
    const app = createApp();
    const phone = "+2250701020304";
    const issue = await request(app).post("/api/auth/terrain/request-otp").send({ phone });
    const recipient = normalizeCiPhone(phone);
    const code = recipient ? peekTerrainOtpForTests(recipient) : null;
    expect(code).toMatch(/^\d{6}$/);

    const verify = await request(app)
      .post("/api/auth/terrain/verify-otp")
      .send({ phone, code });

    expect(issue.status).toBe(200);
    expect(verify.status).toBe(200);
    expect(verify.body.verified).toBe(true);
    expect(verify.body.registrationToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("request-otp sends via Yellika when configured", async () => {
    process.env.YELLIKA_SMS_TOKEN = "test-token";
    process.env.YELLIKA_SMS_SENDER_ID = "Symbioll";
    process.env.SMS_OTP_PRODUCT_NAME = "VENEXT";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "success" }), { status: 200 }),
    );

    const res = await request(createApp())
      .post("/api/auth/terrain/request-otp")
      .send({ phone: "+2250701020304" });

    expect(res.status).toBe(200);
    expect(res.body.delivery).toBe("yellika");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://panel.yellikasms.com/api/v3/sms/send");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    const body = JSON.parse(String(init?.body));
    expect(body.recipient).toBe("+2250701020304");
  });
});
