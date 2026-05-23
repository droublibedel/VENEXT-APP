import type { WalletSecurityFlags } from "./venext-wallet-security.types";

export type BiometricCapability = {
  available: boolean;
  kind: "fingerprint" | "face" | "none";
};

export function detectBiometricCapability(): BiometricCapability {
  if (typeof window === "undefined") {
    return { available: false, kind: "none" };
  }
  const ua = navigator.userAgent ?? "";
  if (/iPhone|iPad|Macintosh/i.test(ua) && /Safari/i.test(ua)) {
    return { available: true, kind: "face" };
  }
  if (/Android/i.test(ua)) {
    return { available: true, kind: "fingerprint" };
  }
  return { available: false, kind: "none" };
}

export function canUseBiometricUnlock(
  flags: WalletSecurityFlags = {},
  biometricEnabled = false,
): boolean {
  if (flags.wallet_biometric_unlock_enabled === false) return false;
  if (!biometricEnabled) return false;
  return detectBiometricCapability().available;
}

export function enableBiometricUnlock(
  flags: WalletSecurityFlags = {},
): { enabled: boolean; message?: string } {
  if (flags.wallet_biometric_unlock_enabled === false) {
    return { enabled: false, message: "Déverrouillage biométrique non disponible sur ce compte." };
  }
  const cap = detectBiometricCapability();
  if (!cap.available) {
    return {
      enabled: false,
      message: "Empreinte ou reconnaissance faciale non disponible sur cet appareil.",
    };
  }
  return { enabled: true };
}
