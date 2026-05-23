import { memo, type ReactNode } from "react";

import { WalletBceaoActivationFlow } from "./WalletBceaoActivationFlow";
import { WalletSecuredLockGate } from "./WalletSecuredLockGate";
import { useVenextWalletSecurity } from "./venext-wallet-security-context";

export type WalletAdaptiveSecurityShellProps = {
  children: ReactNode;
  lockGateTestId?: string;
  activationTestId?: string;
};

/**
 * Instruction 20.78-A — enchaîne activation BCEAO (si PIN absent en mode sécurisé)
 * puis verrouillage PIN/biométrie, sinon contenu wallet libre.
 */
export const WalletAdaptiveSecurityShell = memo(function WalletAdaptiveSecurityShell({
  children,
  lockGateTestId,
  activationTestId,
}: WalletAdaptiveSecurityShellProps) {
  const security = useVenextWalletSecurity();

  const needsActivation =
    security.resolution.mode === "SECURED_WALLET_MODE" && !security.walletState.pinConfigured;

  if (needsActivation) {
    return (
      <WalletBceaoActivationFlow
        testId={activationTestId ?? "wallet-bceao-activation"}
        onComplete={() => security.latchSecuredIfNeeded()}
      />
    );
  }

  if (security.isWalletLocked) {
    return <WalletSecuredLockGate testId={lockGateTestId ?? "wallet-secured-lock-gate"} />;
  }

  return <>{children}</>;
});
