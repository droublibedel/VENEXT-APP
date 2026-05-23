import { isTerrainActor } from "./venext-auth-actor";
import {
  BCEAO_SECURED_BALANCE_THRESHOLD_FCFA,
  SECURED_WALLET_IDLE_TIMEOUT_MS,
  SECURED_WALLET_INACTIVITY_TIMEOUT_MS,
  type WalletSecurityContextInput,
  type WalletSecurityModeResolution,
  type WalletSecurityPersistenceMode,
  type WalletSecurityFlags,
} from "./venext-wallet-security.types";
import { resolveSecurityModelForActor, isFormalSecurityModel } from "./venext-wallet-security-models";

export function resolveTerrainSecuredIdleTimeoutMs(flags: WalletSecurityFlags = {}): number {
  if (flags.wallet_ultra_short_timeout_enabled === false) {
    return SECURED_WALLET_INACTIVITY_TIMEOUT_MS;
  }
  return SECURED_WALLET_IDLE_TIMEOUT_MS;
}

export function isWalletAdaptiveSecurityEnabled(
  flags: WalletSecurityContextInput["flags"] = {},
): boolean {
  return flags.wallet_adaptive_security_enabled !== false;
}

export function shouldLatchSecuredMode(
  balanceFcfa: number,
  persistenceMode: WalletSecurityPersistenceMode,
): WalletSecurityPersistenceMode {
  if (persistenceMode === "SECURED_LATCHED") return "SECURED_LATCHED";
  if (balanceFcfa >= BCEAO_SECURED_BALANCE_THRESHOLD_FCFA) return "SECURED_LATCHED";
  return persistenceMode;
}

export function resolveWalletSecurityMode(
  input: WalletSecurityContextInput,
): WalletSecurityModeResolution {
  const flags = input.flags ?? {};
  const securityModel = resolveSecurityModelForActor(input.actorRole);
  const persistenceMode = input.persistenceMode ?? "LIGHT_ONLY";

  if (isFormalSecurityModel(securityModel)) {
    return {
      mode: "SECURED_WALLET_MODE",
      securityModel,
      unlimitedTerrainSession: false,
      requiresKycForMoney: flags.wallet_bceao_kyc_enabled !== false,
      requiresPinUnlock: false,
      inactivityTimeoutMs: SECURED_WALLET_INACTIVITY_TIMEOUT_MS,
    };
  }

  if (!isWalletAdaptiveSecurityEnabled(flags) || !isTerrainActor(input.actorRole)) {
    return {
      mode: "LIGHT_COMMERCE_MODE",
      securityModel,
      unlimitedTerrainSession: flags.terrain_unlimited_session_enabled !== false,
      requiresKycForMoney: false,
      requiresPinUnlock: false,
      inactivityTimeoutMs: null,
    };
  }

  const latched = shouldLatchSecuredMode(input.balanceFcfa, persistenceMode);
  const secured =
    latched === "SECURED_LATCHED" || input.balanceFcfa >= BCEAO_SECURED_BALANCE_THRESHOLD_FCFA;

  if (!secured) {
    return {
      mode: "LIGHT_COMMERCE_MODE",
      securityModel,
      unlimitedTerrainSession: flags.terrain_unlimited_session_enabled !== false,
      requiresKycForMoney: false,
      requiresPinUnlock: false,
      inactivityTimeoutMs: null,
    };
  }

  return {
    mode: "SECURED_WALLET_MODE",
    securityModel,
    unlimitedTerrainSession: false,
    requiresKycForMoney: flags.wallet_bceao_kyc_enabled !== false,
    requiresPinUnlock: true,
    inactivityTimeoutMs: resolveTerrainSecuredIdleTimeoutMs(flags),
  };
}

export function walletActivationDoesNotTriggerSecuredMode(): boolean {
  return true;
}
