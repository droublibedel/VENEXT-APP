import { describe, expect, it } from "vitest";

import {
  envelopeForMode,
  resolveCommerceFallbackMode,
  resolvePersistenceAvailability,
} from "./commerce-fallback-resolver.js";

describe("commerce-fallback-resolver (20.79-A)", () => {
  it("resolvePersistenceAvailability respects env false", () => {
    const prev = process.env.VENEXT_BACKEND_PERSISTENCE;
    process.env.VENEXT_BACKEND_PERSISTENCE = "false";
    expect(resolvePersistenceAvailability()).toBe("unavailable");
    process.env.VENEXT_BACKEND_PERSISTENCE = prev;
  });

  it("returns FALLBACK when BFF disabled", () => {
    expect(
      resolveCommerceFallbackMode({ bffRoutesEnabled: false, coreReachable: true }),
    ).toBe("FALLBACK");
  });

  it("returns LIVE when core reachable", () => {
    expect(
      resolveCommerceFallbackMode({
        bffRoutesEnabled: true,
        coreReachable: true,
        persistence: "available",
      }),
    ).toBe("LIVE");
  });

  it("returns HYBRID when core reachable but degraded", () => {
    expect(
      resolveCommerceFallbackMode({
        bffRoutesEnabled: true,
        coreReachable: true,
        persistence: "degraded",
      }),
    ).toBe("HYBRID");
  });

  it("envelopeForMode LIVE uses live payload", () => {
    const env = envelopeForMode("LIVE", { ok: true }, { ok: false });
    expect(env.dataSource).toBe("live");
    expect(env.fallbackUsed).toBe(false);
    expect(env.payload).toEqual({ ok: true });
  });

  it("envelopeForMode FALLBACK uses mock", () => {
    const env = envelopeForMode("FALLBACK", null, { ok: false });
    expect(env.fallbackUsed).toBe(true);
    expect(env.payload).toEqual({ ok: false });
  });

  it("devBadge on fallback in non-production", () => {
    const env = envelopeForMode("FALLBACK", null, {});
    expect(env.devBadge).toBe(process.env.NODE_ENV !== "production");
  });
});
