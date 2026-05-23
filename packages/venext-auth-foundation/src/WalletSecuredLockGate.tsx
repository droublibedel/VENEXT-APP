import { memo, useEffect, useState } from "react";

import { useVenextWalletSecurity } from "./venext-wallet-security-context";
import type { WalletSecurityPin } from "./venext-wallet-security.types";
import {
  sanitizeWalletSecurityUxText,
  walletSecuredConfirmAccessLabel,
  walletSecuredPinPrompt,
  walletSecuredSessionTitle,
  WALLET_SECURED_UX_LABELS,
} from "./venext-wallet-security-ux";

export const WalletSecuredLockGate = memo(function WalletSecuredLockGate({
  children,
  testId = "wallet-secured-lock-gate",
}: {
  children?: React.ReactNode;
  testId?: string;
}) {
  const security = useVenextWalletSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPinFallback, setShowPinFallback] = useState(
    security.reentryMethod === "PIN_ONLY",
  );

  useEffect(() => {
    if (security.reentryMethod !== "BIOMETRIC" || showPinFallback) return;
    const result = security.unlock({ useBiometric: true });
    if (!result.ok) setShowPinFallback(true);
  }, [security.reentryMethod, security, showPinFallback]);

  if (security.resolution.mode !== "SECURED_WALLET_MODE" || !security.isWalletLocked) {
    return <>{children}</>;
  }

  const needsPinUi = showPinFallback || security.reentryMethod === "PIN_ONLY";

  const tryUnlock = (useBiometric = false) => {
    const result = security.unlock(
      useBiometric ? { useBiometric: true } : { pin: pin as WalletSecurityPin },
    );
    if (!result.ok) {
      setError(result.message ?? sanitizeWalletSecurityUxText("Confirmez votre accès.", {}));
      return;
    }
    setPin("");
    setError(null);
    setShowPinFallback(security.reentryMethod === "PIN_ONLY");
  };

  const title = walletSecuredSessionTitle();
  const subtitle = needsPinUi ? walletSecuredPinPrompt() : walletSecuredConfirmAccessLabel();

  return (
    <div data-testid={testId}>
      <div
        style={{
          padding: 24,
          borderRadius: 12,
          border: "1px solid #2a3530",
          background: "#121816",
          maxWidth: 360,
          margin: "16px auto",
        }}
      >
        <h2 style={{ fontSize: 18, margin: "0 0 8px" }} data-testid="wallet-lock-title">
          {title}
        </h2>
        <p
          style={{ fontSize: 14, color: "#8fa39a", margin: "0 0 16px" }}
          data-testid="wallet-lock-subtitle"
        >
          {subtitle}
        </p>
        {needsPinUi ? (
          <>
            <input
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              data-testid="wallet-unlock-pin"
              placeholder="••••"
              style={{ width: "100%", marginBottom: 12, minHeight: 44 }}
            />
            <button
              type="button"
              data-testid="wallet-unlock-submit"
              onClick={() => tryUnlock(false)}
            >
              {sanitizeWalletSecurityUxText(WALLET_SECURED_UX_LABELS.unlockAction)}
            </button>
          </>
        ) : null}
        {security.canUseBiometric && security.reentryMethod === "BIOMETRIC" ? (
          <button
            type="button"
            data-testid="wallet-unlock-biometric"
            style={{ marginTop: needsPinUi ? 0 : 8 }}
            onClick={() => tryUnlock(true)}
          >
            {sanitizeWalletSecurityUxText(WALLET_SECURED_UX_LABELS.biometricAction)}
          </button>
        ) : null}
        {!needsPinUi && security.canUseBiometric ? (
          <button
            type="button"
            data-testid="wallet-unlock-use-pin"
            style={{ display: "block", marginTop: 12, fontSize: 13 }}
            onClick={() => setShowPinFallback(true)}
          >
            {sanitizeWalletSecurityUxText("Utiliser le code à 4 chiffres")}
          </button>
        ) : null}
        {error ? (
          <p role="alert" style={{ color: "#e8a090", marginTop: 12, fontSize: 13 }}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
});
