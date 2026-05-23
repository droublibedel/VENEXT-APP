import type { WalletSecurityFlags, WalletSecurityPin } from "./venext-wallet-security.types";
import { SECURED_WALLET_INACTIVITY_TIMEOUT_MS } from "./venext-wallet-security.types";
import { sanitizeWalletSecurityUxText } from "./venext-wallet-security-ux";
import {
  hashWalletPinForStorage,
  validateWalletSecurityPin,
  verifyWalletPin,
} from "./venext-wallet-security-pin";
import { canUseBiometricUnlock } from "./venext-wallet-security-biometric";
import { readWalletSecurityState, updateWalletSecurityState } from "./venext-wallet-security-persistence";

export function isSecuredSessionTimedOut(
  lastActivityAt: string | null,
  now = Date.now(),
  timeoutMs = SECURED_WALLET_INACTIVITY_TIMEOUT_MS,
): boolean {
  if (!lastActivityAt) return true;
  return now - new Date(lastActivityAt).getTime() > timeoutMs;
}

export function secureWalletSession(pin: WalletSecurityPin): {
  ok: boolean;
  reason?: string;
  state?: ReturnType<typeof readWalletSecurityState>;
} {
  const state = readWalletSecurityState();
  if (!verifyWalletPin(state.pinHash ?? null, pin)) {
    return { ok: false, reason: "pin-mismatch" };
  }
  const now = new Date().toISOString();
  const next = updateWalletSecurityState({
    locked: false,
    lastUnlockedAt: now,
    lastActivityAt: now,
  });
  return { ok: true, state: next };
}

export function touchSecuredWalletActivity(): void {
  const state = readWalletSecurityState();
  if (state.locked) return;
  updateWalletSecurityState({ lastActivityAt: new Date().toISOString() });
}

export function lockWalletSession(): void {
  updateWalletSecurityState({ locked: true });
}

/** Instruction 20.78-B — verrouillage instantané (background / sortie app). */
export function lockSecuredWalletSessionImmediately(): void {
  const state = readWalletSecurityState();
  if (!state.pinConfigured) return;
  updateWalletSecurityState({ locked: true });
}

export function restoreSecuredWalletSession(
  input: { pin?: WalletSecurityPin; useBiometric?: boolean },
  flags: WalletSecurityFlags = {},
  options?: { idleTimeoutMs?: number | null },
): { ok: boolean; reason?: string } {
  const state = readWalletSecurityState();
  const timeoutMs = options?.idleTimeoutMs ?? SECURED_WALLET_INACTIVITY_TIMEOUT_MS;

  if (isSecuredSessionTimedOut(state.lastActivityAt, Date.now(), timeoutMs) && state.lastActivityAt) {
    updateWalletSecurityState({ locked: true });
    return { ok: false, reason: "session-timeout" };
  }

  if (input.useBiometric && canUseBiometricUnlock(flags, state.biometricEnabled)) {
    const now = new Date().toISOString();
    updateWalletSecurityState({
      locked: false,
      lastUnlockedAt: now,
      lastActivityAt: now,
    });
    return { ok: true };
  }

  if (!input.pin) return { ok: false, reason: "pin-required" };
  return secureWalletSession(input.pin);
}

export function configureWalletPin(pin: WalletSecurityPin): {
  ok: boolean;
  reason?: string;
} {
  const check = validateWalletSecurityPin(pin);
  if (!check.valid) return { ok: false, reason: check.reason };
  updateWalletSecurityState({
    pinConfigured: true,
    pinHash: hashWalletPinForStorage(pin),
    activationStep: "biometric",
  });
  return { ok: true };
}

export function completeWalletActivation(flags: WalletSecurityFlags = {}): void {
  const bio = flags.wallet_biometric_unlock_enabled !== false;
  updateWalletSecurityState({
    walletActivated: true,
    kycCompleted: true,
    activationStep: "done",
    biometricEnabled: bio && readWalletSecurityState().biometricEnabled,
  });
}

export function securedSessionUxMessage(
  reason?: string,
  flags: WalletSecurityFlags = {},
): string {
  switch (reason) {
    case "session-timeout":
      return sanitizeWalletSecurityUxText(
        "Session sécurisée — confirmez votre accès avec votre code à 4 chiffres.",
        flags,
      );
    case "pin-required":
      return sanitizeWalletSecurityUxText("Confirmez votre accès pour continuer.", flags);
    case "pin-mismatch":
      return sanitizeWalletSecurityUxText("Code incorrect. Réessayez.", flags);
    default:
      return sanitizeWalletSecurityUxText("Session sécurisée", flags);
  }
}
