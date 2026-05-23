import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("realtime-ws-subscribe-auth (Instruction 15A)", () => {
  const snapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...snapshot };
  });

  afterEach(() => {
    process.env = { ...snapshot };
  });

  it("rejects subscribe in production strict mode without valid token", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_AUTH_BYPASS = "false";
    process.env.VENEXT_WS_SUBSCRIBE_SECRET = "secret123";
    const mod = await import("./realtime-ws-subscribe-auth");
    const r = mod.validateRealtimeSubscribeAuth({
      type: "subscribe",
      poles: ["SUPPLY_LOGISTICS"],
      organizationId: "31111111-1111-1111-1111-111111111101",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("subscribe_auth_invalid");
  });

  it("allows subscribe when not strict (development)", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.VENEXT_WS_SUBSCRIBE_SECRET;
    const mod = await import("./realtime-ws-subscribe-auth");
    const r = mod.validateRealtimeSubscribeAuth({
      type: "subscribe",
      poles: ["SUPPLY_LOGISTICS"],
      organizationId: "31111111-1111-1111-1111-111111111101",
    });
    expect(r.ok).toBe(true);
  });

  it("allows subscribe in production when secret not configured (open migration)", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_AUTH_BYPASS = "false";
    delete process.env.VENEXT_WS_SUBSCRIBE_SECRET;
    const mod = await import("./realtime-ws-subscribe-auth");
    expect(mod.isRealtimeSubscribeAuthStrict()).toBe(false);
    const r = mod.validateRealtimeSubscribeAuth({ type: "subscribe", poles: ["X"] });
    expect(r.ok).toBe(true);
  });
});
