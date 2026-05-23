import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { VenextActorRole } from "./venext-auth.types";
import { resolveWalletSecurityMode } from "./venext-wallet-security-mode";
import type {
  WalletIdentityDocument,
  WalletKycIntent,
  WalletSecurityFlags,
  WalletSecurityModeResolution,
  WalletSecurityPin,
} from "./venext-wallet-security.types";
import { requiresBceaoKyc, validateWalletIdentityDocument } from "./venext-wallet-security-kyc";
import { resolveWalletReentryMethod } from "./venext-wallet-security-reentry";
import {
  configureWalletPin,
  lockSecuredWalletSessionImmediately,
  lockWalletSession,
  restoreSecuredWalletSession,
  securedSessionUxMessage,
  touchSecuredWalletActivity,
} from "./venext-wallet-security-session";
import { useSecuredWalletTerrainLifecycle } from "./useSecuredWalletTerrainLifecycle";
import type { WalletReentryMethod } from "./venext-wallet-security.types";
import {
  clearWalletSecurityPersistence,
  readWalletSecurityState,
  setWalletSecurityPersistenceMode,
  updateWalletSecurityState,
} from "./venext-wallet-security-persistence";
import { enableBiometricUnlock, canUseBiometricUnlock } from "./venext-wallet-security-biometric";
import { parseWalletBalanceFcfa } from "./venext-wallet-adaptive-session";
import {
  readSyncedWalletBalanceFcfa,
  subscribeWalletBalanceSync,
} from "./venext-wallet-balance-sync";
import { shouldLatchSecuredMode } from "./venext-wallet-security-mode";

export type VenextWalletSecurityContextValue = {
  balanceFcfa: number;
  resolution: WalletSecurityModeResolution;
  walletState: ReturnType<typeof readWalletSecurityState>;
  isWalletLocked: boolean;
  requiresKyc: (intent: WalletKycIntent) => boolean;
  validateIdentity: (doc: Partial<WalletIdentityDocument>) => ReturnType<typeof validateWalletIdentityDocument>;
  setPin: (pin: WalletSecurityPin) => { ok: boolean; reason?: string };
  enableBiometric: () => { enabled: boolean; message?: string };
  canUseBiometric: boolean;
  reentryMethod: WalletReentryMethod;
  unlock: (input: { pin?: string; useBiometric?: boolean }) => { ok: boolean; message?: string };
  lock: () => void;
  lockImmediately: () => void;
  touchActivity: () => void;
  latchSecuredIfNeeded: () => void;
};

const VenextWalletSecurityCtx = createContext<VenextWalletSecurityContextValue | null>(null);

export const VenextWalletSecurityProvider = memo(function VenextWalletSecurityProvider({
  actorRole,
  balanceFcfa = 0,
  flags = {},
  children,
}: {
  actorRole: VenextActorRole;
  balanceFcfa?: number | string;
  flags?: WalletSecurityFlags;
  children: ReactNode;
}) {
  const propBalance = parseWalletBalanceFcfa(balanceFcfa);
  const [syncedBalance, setSyncedBalance] = useState(() =>
    propBalance > 0 ? propBalance : readSyncedWalletBalanceFcfa(),
  );

  useEffect(() => {
    return subscribeWalletBalanceSync(setSyncedBalance);
  }, []);

  const parsedBalance = propBalance > 0 ? propBalance : syncedBalance;
  const [walletState, setWalletState] = useState(() => readWalletSecurityState());

  const resolution = useMemo(
    () =>
      resolveWalletSecurityMode({
        actorRole,
        balanceFcfa: parsedBalance,
        walletActivated: walletState.walletActivated,
        flags,
        persistenceMode: walletState.persistenceMode,
      }),
    [actorRole, parsedBalance, walletState.walletActivated, walletState.persistenceMode, flags],
  );

  const latchSecuredIfNeeded = useCallback(() => {
    const nextMode = shouldLatchSecuredMode(parsedBalance, walletState.persistenceMode);
    if (nextMode !== walletState.persistenceMode) {
      setWalletSecurityPersistenceMode(nextMode);
      setWalletState(readWalletSecurityState());
    }
  }, [parsedBalance, walletState.persistenceMode]);

  useEffect(() => {
    latchSecuredIfNeeded();
  }, [latchSecuredIfNeeded]);

  const refreshWalletState = useCallback(() => {
    setWalletState(readWalletSecurityState());
  }, []);

  useSecuredWalletTerrainLifecycle(
    resolution,
    flags,
    walletState.pinConfigured,
    refreshWalletState,
  );

  const isWalletLocked =
    resolution.mode === "SECURED_WALLET_MODE" &&
    (walletState.locked || !walletState.pinConfigured);

  const value = useMemo(
    (): VenextWalletSecurityContextValue => ({
      balanceFcfa: parsedBalance,
      resolution,
      walletState,
      isWalletLocked,
      requiresKyc: (intent) =>
        flags.wallet_bceao_kyc_enabled !== false && requiresBceaoKyc(intent),
      validateIdentity: validateWalletIdentityDocument,
      setPin: (pin) => {
        const result = configureWalletPin(pin);
        if (result.ok) setWalletState(readWalletSecurityState());
        return result;
      },
      enableBiometric: () => {
        const result = enableBiometricUnlock(flags);
        if (result.enabled) {
          updateWalletSecurityState({ biometricEnabled: true });
          setWalletState(readWalletSecurityState());
        }
        return result;
      },
      canUseBiometric: canUseBiometricUnlock(flags, walletState.biometricEnabled),
      reentryMethod: resolveWalletReentryMethod(flags, walletState.biometricEnabled),
      unlock: (input) => {
        const result = restoreSecuredWalletSession(input, flags, {
          idleTimeoutMs: resolution.inactivityTimeoutMs,
        });
        setWalletState(readWalletSecurityState());
        return {
          ok: result.ok,
          message: result.ok ? undefined : securedSessionUxMessage(result.reason, flags),
        };
      },
      lock: () => {
        lockWalletSession();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("venext:wallet-secured-lock"));
        }
        setWalletState(readWalletSecurityState());
      },
      lockImmediately: () => {
        lockSecuredWalletSessionImmediately();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("venext:wallet-secured-lock"));
        }
        setWalletState(readWalletSecurityState());
      },
      touchActivity: () => {
        touchSecuredWalletActivity();
        setWalletState(readWalletSecurityState());
      },
      latchSecuredIfNeeded,
    }),
    [parsedBalance, resolution, walletState, isWalletLocked, flags, latchSecuredIfNeeded, refreshWalletState],
  );

  return <VenextWalletSecurityCtx.Provider value={value}>{children}</VenextWalletSecurityCtx.Provider>;
});

export function useVenextWalletSecurity(): VenextWalletSecurityContextValue {
  const ctx = useContext(VenextWalletSecurityCtx);
  if (!ctx) {
    throw new Error("useVenextWalletSecurity must be used within VenextWalletSecurityProvider");
  }
  return ctx;
}

export function useVenextWalletSecurityOptional(): VenextWalletSecurityContextValue | null {
  return useContext(VenextWalletSecurityCtx);
}

export { clearWalletSecurityPersistence };
