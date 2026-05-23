import { describe, expect, it, beforeEach } from "vitest";

import { createAuthSession } from "./venext-auth-session";
import { isSessionExpired, validateSessionActor } from "./venext-auth-security.guard";
import { isFormalActor, isTerrainActor } from "./venext-auth-actor";
import {
  BCEAO_SECURED_BALANCE_THRESHOLD_FCFA,
  SECURED_WALLET_IDLE_TIMEOUT_MS,
  SECURED_WALLET_INACTIVITY_TIMEOUT_MS,
} from "./venext-wallet-security.types";
import {
  resolveWalletSecurityMode,
  shouldLatchSecuredMode,
  walletActivationDoesNotTriggerSecuredMode,
} from "./venext-wallet-security-mode";
import {
  resolveSecurityModelForActor,
  formalSessionRequiresStrongPassword,
} from "./venext-wallet-security-models";
import {
  validateWalletSecurityPin,
  verifyWalletPin,
  hashWalletPinForStorage,
} from "./venext-wallet-security-pin";
import {
  requiresBceaoKyc,
  validateWalletIdentityDocument,
  kycBlocksCommerceOnboarding,
  nextWalletActivationStep,
} from "./venext-wallet-security-kyc";
import {
  canUseBiometricUnlock,
  enableBiometricUnlock,
} from "./venext-wallet-security-biometric";
import {
  configureWalletPin,
  isSecuredSessionTimedOut,
  lockWalletSession,
  restoreSecuredWalletSession,
  secureWalletSession,
} from "./venext-wallet-security-session";
import {
  clearWalletSecurityPersistence,
  readWalletSecurityState,
  updateWalletSecurityState,
} from "./venext-wallet-security-persistence";
import {
  isTerrainUnlimitedSession,
  parseWalletBalanceFcfa,
} from "./venext-wallet-adaptive-session";
import { createInitialAuthState } from "./venext-auth.viewmodel";
import {
  readSyncedWalletBalanceFcfa,
  syncWalletBalanceFcfa,
} from "./venext-wallet-balance-sync";

const terrainFlags = {
  venext_auth_foundation_enabled: true,
  terrain_unlimited_session_enabled: true,
  wallet_adaptive_security_enabled: true,
  wallet_bceao_kyc_enabled: true,
  wallet_biometric_unlock_enabled: true,
  wallet_instant_background_lock_enabled: true,
  wallet_ultra_short_timeout_enabled: true,
};

describe("venext-wallet-security (20.78-A)", () => {
  beforeEach(() => {
    clearWalletSecurityPersistence();
    localStorage.clear();
  });

  it("terrain unlimited session when balance below threshold", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "GROSSISTE_B",
      balanceFcfa: 0,
      flags: terrainFlags,
    });
    expect(r.mode).toBe("LIGHT_COMMERCE_MODE");
    expect(r.unlimitedTerrainSession).toBe(true);
  });

  it("wallet activated alone does not secure", () => {
    expect(walletActivationDoesNotTriggerSecuredMode()).toBe(true);
    const r = resolveWalletSecurityMode({
      actorRole: "DETAILLANT",
      balanceFcfa: 0,
      walletActivated: true,
      flags: terrainFlags,
    });
    expect(r.mode).toBe("LIGHT_COMMERCE_MODE");
  });

  it("balance >= 1000 triggers secured mode", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "GROSSISTE_B",
      balanceFcfa: BCEAO_SECURED_BALANCE_THRESHOLD_FCFA,
      flags: terrainFlags,
    });
    expect(r.mode).toBe("SECURED_WALLET_MODE");
    expect(r.requiresPinUnlock).toBe(true);
    expect(r.inactivityTimeoutMs).toBe(SECURED_WALLET_IDLE_TIMEOUT_MS);
  });

  it("secured mode latches when balance drops", () => {
    updateWalletSecurityState({ persistenceMode: "SECURED_LATCHED" });
    const r = resolveWalletSecurityMode({
      actorRole: "GROSSISTE_B",
      balanceFcfa: 100,
      persistenceMode: "SECURED_LATCHED",
      flags: terrainFlags,
    });
    expect(r.mode).toBe("SECURED_WALLET_MODE");
  });

  it("shouldLatchSecuredMode at threshold", () => {
    expect(shouldLatchSecuredMode(1000, "LIGHT_ONLY")).toBe("SECURED_LATCHED");
  });

  it("session terrain illimitée — pas d'expiration", () => {
    const session = createAuthSession("GROSSISTE_B", "terrain_otp", Date.now(), {
      unlimitedTerrainSession: true,
    });
    expect(isSessionExpired(session, Date.now(), { unlimitedTerrainSession: true })).toBe(false);
    expect(
      validateSessionActor(session, "GROSSISTE_B", { unlimitedTerrainSession: true }).valid,
    ).toBe(true);
  });

  it("producer uses formal security model", () => {
    expect(resolveSecurityModelForActor("PRODUCER")).toBe("FORMAL_SECURITY_MODEL");
    expect(isFormalActor("PRODUCER")).toBe(true);
    const r = resolveWalletSecurityMode({
      actorRole: "PRODUCER",
      balanceFcfa: 0,
      flags: terrainFlags,
    });
    expect(r.unlimitedTerrainSession).toBe(false);
  });

  it("grossiste A non terrain model", () => {
    expect(resolveSecurityModelForActor("GROSSISTE_A")).toBe("FORMAL_SECURITY_MODEL");
    expect(isTerrainActor("GROSSISTE_A")).toBe(false);
  });

  it("formal requires strong password policy flag", () => {
    expect(formalSessionRequiresStrongPassword()).toBe(true);
  });

  it("PIN exactly 4 digits valid", () => {
    expect(validateWalletSecurityPin("1234").valid).toBe(true);
    expect(validateWalletSecurityPin("123").valid).toBe(false);
    expect(validateWalletSecurityPin("12a4").valid).toBe(false);
  });

  it("invalid PIN rejected on unlock", () => {
    configureWalletPin("5678");
    expect(secureWalletSession("0000").ok).toBe(false);
  });

  it("valid PIN unlocks secured session", () => {
    configureWalletPin("4321");
    expect(secureWalletSession("4321").ok).toBe(true);
    expect(readWalletSecurityState().locked).toBe(false);
  });

  it("biometric optional when disabled in flags", () => {
    expect(
      canUseBiometricUnlock({ wallet_biometric_unlock_enabled: false }, true),
    ).toBe(false);
  });

  it("enableBiometricUnlock respects flags", () => {
    const off = enableBiometricUnlock({ wallet_biometric_unlock_enabled: false });
    expect(off.enabled).toBe(false);
  });

  it("restore secured session with PIN after lock", () => {
    configureWalletPin("1111");
    secureWalletSession("1111");
    lockWalletSession();
    const r = restoreSecuredWalletSession({ pin: "1111" }, terrainFlags);
    expect(r.ok).toBe(true);
  });

  it("formal inactivity timeout remains 20 minutes", () => {
    const past = new Date(Date.now() - SECURED_WALLET_INACTIVITY_TIMEOUT_MS - 1000).toISOString();
    expect(isSecuredSessionTimedOut(past, Date.now(), SECURED_WALLET_INACTIVITY_TIMEOUT_MS)).toBe(
      true,
    );
    expect(
      isSecuredSessionTimedOut(new Date().toISOString(), Date.now(), SECURED_WALLET_INACTIVITY_TIMEOUT_MS),
    ).toBe(false);
  });

  it("lock wallet session", () => {
    configureWalletPin("9999");
    secureWalletSession("9999");
    lockWalletSession();
    expect(readWalletSecurityState().locked).toBe(true);
  });

  it("KYC required for receive hold pay only", () => {
    expect(requiresBceaoKyc("receive")).toBe(true);
    expect(requiresBceaoKyc("hold")).toBe(true);
    expect(requiresBceaoKyc("pay")).toBe(true);
  });

  it("KYC does not block commerce onboarding", () => {
    expect(kycBlocksCommerceOnboarding()).toBe(false);
  });

  it("invalid document blur rejected with human message", () => {
    const r = validateWalletIdentityDocument({
      firstName: "Aya",
      lastName: "Koné",
      birthDate: "1990-01-15",
      documentType: "CNI",
      documentNumber: "CI123456",
      photoQuality: "blur",
    });
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/nette/i);
  });

  it("valid identity document accepted", () => {
    const r = validateWalletIdentityDocument({
      firstName: "Aya",
      lastName: "Koné",
      birthDate: "1990-01-15",
      documentType: "CNI",
      documentNumber: "CI123456",
      photoQuality: "ok",
    });
    expect(r.valid).toBe(true);
  });

  it("parseWalletBalanceFcfa from label", () => {
    expect(parseWalletBalanceFcfa("850 FCFA")).toBe(850);
    expect(parseWalletBalanceFcfa(1200)).toBe(1200);
  });

  it("isTerrainUnlimitedSession helper", () => {
    expect(
      isTerrainUnlimitedSession({
        actorRole: "DETAILLANT",
        balanceFcfa: 50,
        flags: terrainFlags,
      }),
    ).toBe(true);
  });

  it("restore initial auth with unlimited terrain", () => {
    const state = createInitialAuthState("GROSSISTE_B", terrainFlags, { balanceFcfa: 0 });
    expect(state.status).toBe("anonymous");
  });

  it("actor mismatch still invalid with unlimited", () => {
    const session = createAuthSession("GROSSISTE_B", "terrain_otp", Date.now(), {
      unlimitedTerrainSession: true,
    });
    expect(
      validateSessionActor(session, "DETAILLANT", { unlimitedTerrainSession: true }).valid,
    ).toBe(false);
  });

  it("pin hash roundtrip", () => {
    const hash = hashWalletPinForStorage("2468");
    expect(verifyWalletPin(hash, "2468")).toBe(true);
  });

  it("next activation step advances flow", () => {
    expect(nextWalletActivationStep("identity")).toBe("document");
    expect(nextWalletActivationStep("pin")).toBe("biometric");
  });

  it("biometric enable on android user agent", () => {
    const ua = "Mozilla/5.0 (Linux; Android 14)";
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: ua,
      configurable: true,
    });
    const r = enableBiometricUnlock(terrainFlags);
    expect(r.enabled).toBe(true);
  });

  it("syncWalletBalanceFcfa persists balance", () => {
    syncWalletBalanceFcfa(1500);
    expect(readSyncedWalletBalanceFcfa()).toBe(1500);
  });

  it("adaptive security off keeps light mode", () => {
    const r = resolveWalletSecurityMode({
      actorRole: "GROSSISTE_B",
      balanceFcfa: 5000,
      flags: { wallet_adaptive_security_enabled: false },
    });
    expect(r.mode).toBe("LIGHT_COMMERCE_MODE");
  });
});
