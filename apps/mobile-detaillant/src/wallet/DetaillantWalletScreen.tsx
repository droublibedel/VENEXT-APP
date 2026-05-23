import { memo, useMemo } from "react";

import { CommerceWalletShell } from "commerce-wallet";
import "commerce-wallet/styles.css";

import { DetaillantScreenHeader } from "../components/DetaillantScreenHeader";
import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { buildRetailSettlementHints } from "./detaillant-wallet-intelligence";
import { detaillantWalletAccountSettings } from "./detaillant-wallet-governance";
import {
  clearCommerceWalletCache,
  useCommerceTransactions,
  useCommerceWalletBalance,
} from "commerce-wallet";
import {
  useVenextWalletSecurityOptional,
  useWalletBalanceSync,
  WalletAdaptiveSecurityShell,
} from "venext-auth-foundation";

export const DetaillantWalletScreen = memo(function DetaillantWalletScreen({
  enabled,
}: {
  enabled: boolean;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const walletEnabled =
    hydrated && enabled && flags.detaillant_wallet_enabled !== false;

  const accountSettings = useMemo(() => detaillantWalletAccountSettings(), []);
  const opts = { enabled: walletEnabled, liveEnabled: false };
  const balance = useCommerceWalletBalance(opts);
  const transactions = useCommerceTransactions(opts);
  const walletSecurity = useVenextWalletSecurityOptional();

  useWalletBalanceSync(balance.data?.availableLabel ?? 0);

  const retailTx = useMemo(
    () => (transactions.data ?? []).filter((t) => t.actorRole === "detaillant"),
    [transactions.data],
  );

  const hints = useMemo(() => buildRetailSettlementHints(retailTx), [retailTx]);

  if (!walletEnabled) {
    return null;
  }

  const content = (
    <>
      <DetaillantScreenHeader
        title="Mes règlements"
        subtitle="Cash ou mobile money — optionnel."
      />
      {hints.map((h) => (
        <p
          key={h.id}
          style={{ margin: "0 16px 8px", fontSize: 13, color: "#7dd3b0" }}
          data-testid="detaillant-wallet-hint"
        >
          {h.text}
        </p>
      ))}
      <p
        style={{ margin: "0 16px 12px", fontSize: 12, color: "#8fa39a" }}
        data-testid="detaillant-wallet-optional"
      >
        Vous pouvez commander sans ouvrir cette section.
      </p>
      <button
        type="button"
        className="detaillant-btn detaillant-btn--primary"
        data-testid="detaillant-wallet-refresh"
        style={{ margin: "0 16px 12px", minHeight: 44, width: "calc(100% - 32px)" }}
        onClick={() => {
          clearCommerceWalletCache();
          balance.refresh();
          transactions.refresh();
          walletSecurity?.touchActivity();
        }}
      >
        Actualiser
      </button>
      <CommerceWalletShell
        enabled
        liveEnabled={false}
        governanceEnabled
        layout="mobile"
        testId="detaillant-commerce-wallet"
        accountSettings={accountSettings}
        actorRole="detaillant"
      />
    </>
  );

  return (
    <section data-testid="detaillant-wallet-section">
      {walletSecurity ? (
        <WalletAdaptiveSecurityShell
          lockGateTestId="detaillant-wallet-lock-gate"
          activationTestId="detaillant-wallet-bceao-activation"
        >
          {content}
        </WalletAdaptiveSecurityShell>
      ) : (
        content
      )}
    </section>
  );
});
