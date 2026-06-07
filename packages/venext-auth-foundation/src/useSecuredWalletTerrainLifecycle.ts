import { useEffect, useRef } from "react";

import { UserActivityTrackerRuntime } from "./user-activity-tracker-runtime";
import { isTerrainSecurityModel } from "./venext-wallet-security-models";
import {
  lockSecuredWalletSessionImmediately,
  touchSecuredWalletActivity,
} from "./venext-wallet-security-session";
import type {
  WalletSecurityFlags,
  WalletSecurityModeResolution,
} from "./venext-wallet-security.types";

function isTerrainSecuredSession(resolution: WalletSecurityModeResolution): boolean {
  return (
    resolution.mode === "SECURED_WALLET_MODE" && isTerrainSecurityModel(resolution.securityModel)
  );
}

function shouldInstantBackgroundLock(flags: WalletSecurityFlags): boolean {
  return flags.wallet_instant_background_lock_enabled !== false;
}

/**
 * Instruction 20.78-B — verrouillage immédiat (background) + timer inactivité terrain.
 */
export function useSecuredWalletTerrainLifecycle(
  resolution: WalletSecurityModeResolution,
  flags: WalletSecurityFlags,
  pinConfigured: boolean,
  onStateChange: () => void,
): void {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active =
    isTerrainSecuredSession(resolution) &&
    pinConfigured &&
    flags.wallet_adaptive_security_enabled !== false;

  const idleTimeoutMs = resolution.inactivityTimeoutMs;

  useEffect(() => {
    if (!active || idleTimeoutMs == null) return;

    const scheduleIdleLock = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        lockSecuredWalletSessionImmediately();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("venext:wallet-secured-lock"));
        }
        onStateChange();
      }, idleTimeoutMs);
    };

    const onActivity = () => {
      touchSecuredWalletActivity();
      scheduleIdleLock();
    };

    const tracker = new UserActivityTrackerRuntime({ onActivity, enabled: true });
    tracker.attach();

    const lockNow = () => {
      if (!shouldInstantBackgroundLock(flags)) return;
      lockSecuredWalletSessionImmediately();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("venext:wallet-secured-lock"));
      }
      onStateChange();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") lockNow();
      else onActivity();
    };

    const onBlur = () => lockNow();
    const onFocus = () => onActivity();
    const onPageHide = () => lockNow();

    scheduleIdleLock();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      tracker.detach();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [active, idleTimeoutMs, flags, onStateChange]);
}
