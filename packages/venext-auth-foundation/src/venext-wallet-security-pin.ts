import type { WalletSecurityPin } from "./venext-wallet-security.types";

const PIN_PATTERN = /^\d{4}$/;

export function validateWalletSecurityPin(pin: string): { valid: boolean; reason?: string } {
  const trimmed = pin.trim();
  if (trimmed.length !== 4) {
    return { valid: false, reason: "pin-length" };
  }
  if (!PIN_PATTERN.test(trimmed)) {
    return { valid: false, reason: "pin-numeric" };
  }
  return { valid: true };
}

export function normalizeWalletSecurityPin(pin: string): WalletSecurityPin {
  return pin.trim();
}

export function pinUxMessage(reason?: string): string {
  switch (reason) {
    case "pin-length":
      return "Le code doit contenir exactement 4 chiffres.";
    case "pin-numeric":
      return "Utilisez uniquement des chiffres pour votre code.";
    case "pin-mismatch":
      return "Code incorrect. Réessayez.";
    default:
      return "Code wallet invalide.";
  }
}

export function hashWalletPinForStorage(pin: WalletSecurityPin): string {
  if (typeof btoa !== "undefined") {
    return btoa(`venext-pin:${pin}`);
  }
  return `venext-pin:${pin}`;
}

export function verifyWalletPin(storedHash: string | null, pin: WalletSecurityPin): boolean {
  if (!storedHash) return false;
  return storedHash === hashWalletPinForStorage(pin);
}
