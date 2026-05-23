import { canUseBiometricUnlock } from "./venext-wallet-security-biometric";
import type { WalletReentryMethod, WalletSecurityFlags } from "./venext-wallet-security.types";

export function resolveWalletReentryMethod(
  flags: WalletSecurityFlags = {},
  biometricEnabled = false,
): WalletReentryMethod {
  if (canUseBiometricUnlock(flags, biometricEnabled)) {
    return "BIOMETRIC";
  }
  return "PIN_ONLY";
}
