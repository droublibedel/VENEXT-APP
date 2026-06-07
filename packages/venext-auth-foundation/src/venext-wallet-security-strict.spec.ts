import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isFormalActor, isTerrainActor } from "./venext-auth-actor";
import { resolveWalletReentryMethod } from "./venext-wallet-security-reentry";
import { sanitizeWalletSecurityUxText } from "./venext-wallet-security-ux";
import {
  SECURED_WALLET_IDLE_TIMEOUT_MS,
  SECURED_WALLET_INACTIVITY_TIMEOUT_MS,
} from "./venext-wallet-security.types";
import { resolveWalletSecurityMode, resolveTerrainSecuredIdleTimeoutMs } from "./venext-wallet-security-mode";
import {
  configureWalletPin,
  isSecuredSessionTimedOut,
  lockSecuredWalletSessionImmediately,
  lockWalletSession,
  restoreSecuredWalletSession,
  secureWalletSession,
  touchSecuredWalletActivity,
} from "./venext-wallet-security-session";
import {
  clearWalletSecurityPersistence,
  readWalletSecurityState,
} from "./venext-wallet-security-persistence";

const terrainStrictFlags = {
  wallet_adaptive_security_enabled: true,
  wallet_ultra_short_timeout_enabled: true,
  wallet_instant_background_lock_enabled: true,
  wallet_biometric_unlock_enabled: true,
  terrain_unlimited_session_enabled: true,
};

describe("venext-wallet-security strict terrain (20.78-B)", () => {
  beforeEach(() => {
    clearWalletSecurityPersistence();
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("SECURED_WALLET_IDLE_TIMEOUT_MS is exactly 15 seconds", () => {
    expect(SECURED_WALLET_IDLE_TIMEOUT_MS).toBe(15_000);
  });

  it("terrain secured mode uses 15 second idle timeout when flag on", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "GROSSISTE_B",
      balanceFcfa: 1500,
      flags: terrainStrictFlags,
    });
    expect(r.mode).toBe("SECURED_WALLET_MODE");
    expect(r.inactivityTimeoutMs).toBe(15_000);
    expect(resolveTerrainSecuredIdleTimeoutMs(terrainStrictFlags)).toBe(15_000);
  });

  it("producer formal mode keeps 20 minute timeout", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "PRODUCER",
      balanceFcfa: 0,
      flags: terrainStrictFlags,
    });
    expect(isFormalActor("PRODUCER")).toBe(true);
    expect(r.inactivityTimeoutMs).toBe(SECURED_WALLET_INACTIVITY_TIMEOUT_MS);
    expect(r.inactivityTimeoutMs).not.toBe(SECURED_WALLET_IDLE_TIMEOUT_MS);
  });

  it("grossiste A formal mode keeps 20 minute timeout", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "GROSSISTE_A",
      balanceFcfa: 5000,
      flags: terrainStrictFlags,
    });
    expect(isTerrainActor("GROSSISTE_A")).toBe(false);
    expect(r.inactivityTimeoutMs).toBe(SECURED_WALLET_INACTIVITY_TIMEOUT_MS);
  });

  it("light mode wallet below 1000 has no idle timeout", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "DETAILLANT",
      balanceFcfa: 500,
      flags: terrainStrictFlags,
    });
    expect(r.mode).toBe("LIGHT_COMMERCE_MODE");
    expect(r.inactivityTimeoutMs).toBeNull();
  });

  it("lockSecuredWalletSessionImmediately locks when PIN configured", () => {
    configureWalletPin("1234");
    secureWalletSession("1234");
    lockSecuredWalletSessionImmediately();
    expect(readWalletSecurityState().locked).toBe(true);
  });

  it("immediate lock does nothing without PIN", () => {
    lockSecuredWalletSessionImmediately();
    expect(readWalletSecurityState().locked).toBe(false);
  });

  it("15 second inactivity timeout expires session", () => {
    vi.useFakeTimers();
    configureWalletPin("4321");
    secureWalletSession("4321");
    touchSecuredWalletActivity();
    const at = readWalletSecurityState().lastActivityAt!;
    vi.advanceTimersByTime(SECURED_WALLET_IDLE_TIMEOUT_MS + 1);
    expect(isSecuredSessionTimedOut(at, Date.now(), SECURED_WALLET_IDLE_TIMEOUT_MS)).toBe(true);
  });

  it("interaction resets inactivity timer via lastActivityAt", () => {
    configureWalletPin("1111");
    secureWalletSession("1111");
    const before = readWalletSecurityState().lastActivityAt;
    vi.useFakeTimers();
    vi.advanceTimersByTime(5_000);
    touchSecuredWalletActivity();
    const after = readWalletSecurityState().lastActivityAt;
    expect(after).not.toBe(before);
  });

  it("return after lock requires PIN", () => {
    configureWalletPin("2468");
    secureWalletSession("2468");
    lockWalletSession();
    const r = restoreSecuredWalletSession(
      { pin: "2468" },
      terrainStrictFlags,
      { idleTimeoutMs: SECURED_WALLET_IDLE_TIMEOUT_MS },
    );
    expect(r.ok).toBe(true);
    expect(readWalletSecurityState().locked).toBe(false);
  });

  it("resolveWalletReentryMethod prefers biometric when enabled", () => {
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14)",
      configurable: true,
    });
    expect(resolveWalletReentryMethod(terrainStrictFlags, true)).toBe("BIOMETRIC");
    expect(resolveWalletReentryMethod(terrainStrictFlags, false)).toBe("PIN_ONLY");
  });

  it("sanitizeWalletSecurityUxText removes enterprise jargon", () => {
    const out = sanitizeWalletSecurityUxText("token expired — authentication failed");
    expect(out).not.toMatch(/token expired/i);
    expect(out).not.toMatch(/authentication failed/i);
    expect(out).toMatch(/Session sécurisée/i);
  });

  it("ultra short timeout flag off falls back to 20 minutes for terrain", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "GROSSISTE_B",
      balanceFcfa: 2000,
      flags: { ...terrainStrictFlags, wallet_ultra_short_timeout_enabled: false },
    });
    expect(r.inactivityTimeoutMs).toBe(SECURED_WALLET_INACTIVITY_TIMEOUT_MS);
  });
});
