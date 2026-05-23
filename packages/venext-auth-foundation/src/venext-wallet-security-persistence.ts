import type {
  WalletSecurityPersistenceMode,
  WalletSecurityState,
} from "./venext-wallet-security.types";
import { VENEXT_WALLET_SECURITY_STORAGE_KEY } from "./venext-wallet-security.types";

export const defaultWalletSecurityState = (): WalletSecurityState => ({
  walletActivated: false,
  kycCompleted: false,
  pinConfigured: false,
  biometricEnabled: false,
  persistenceMode: "LIGHT_ONLY",
  locked: false,
  lastUnlockedAt: null,
  lastActivityAt: null,
  activationStep: "activation",
});

export function readWalletSecurityState(): WalletSecurityState {
  try {
    const raw = localStorage.getItem(VENEXT_WALLET_SECURITY_STORAGE_KEY);
    if (!raw) return defaultWalletSecurityState();
    return { ...defaultWalletSecurityState(), ...(JSON.parse(raw) as WalletSecurityState) };
  } catch {
    return defaultWalletSecurityState();
  }
}

export function writeWalletSecurityState(state: WalletSecurityState): void {
  localStorage.setItem(VENEXT_WALLET_SECURITY_STORAGE_KEY, JSON.stringify(state));
}

export function updateWalletSecurityState(
  patch: Partial<WalletSecurityState>,
): WalletSecurityState {
  const next = { ...readWalletSecurityState(), ...patch };
  writeWalletSecurityState(next);
  return next;
}

export function setWalletSecurityPersistenceMode(
  mode: WalletSecurityPersistenceMode,
): WalletSecurityPersistenceMode {
  updateWalletSecurityState({ persistenceMode: mode });
  return mode;
}

export function clearWalletSecurityPersistence(): void {
  localStorage.removeItem(VENEXT_WALLET_SECURITY_STORAGE_KEY);
}
