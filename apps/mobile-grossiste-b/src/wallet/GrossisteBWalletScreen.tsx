import { memo, useEffect, useMemo } from "react";
import {
  assertAndroidBackFromWalletBlocked,
  getPostLockSafeRoute,
  releaseWalletNavigationLock,
  secureWalletNavigationReset,
} from "commerce-performance-foundation";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { CommerceWalletShell } from "commerce-wallet";
import "commerce-wallet/styles.css";

import { GrossisteScreenHeader } from "../components/GrossisteScreenHeader";
import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { buildGrossisteSettlementHints } from "./grossiste-b-wallet-intelligence";
import { grossisteBWalletAccountSettings } from "./grossiste-b-wallet-governance";
import {
  clearCommerceWalletCache,
  useCommercePaymentActivity,
  useCommerceTransactions,
  useCommerceWalletBalance,
} from "commerce-wallet";
import {
  useVenextWalletSecurityOptional,
  useWalletBalanceSync,
  WalletAdaptiveSecurityShell,
} from "venext-auth-foundation";

export const GrossisteBWalletScreen = memo(function GrossisteBWalletScreen({
  enabled,
  routingInput: _routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const walletEnabled =
    hydrated && enabled && flags.grossiste_b_wallet_enabled !== false;

  const accountSettings = useMemo(() => grossisteBWalletAccountSettings(flags), [flags]);
  const opts = { enabled: walletEnabled, liveEnabled: false };

  const balance = useCommerceWalletBalance(opts);
  const transactions = useCommerceTransactions(opts);
  const activity = useCommercePaymentActivity(opts);
  const walletSecurity = useVenextWalletSecurityOptional();

  useWalletBalanceSync(balance.data?.availableLabel ?? 0);

  useEffect(() => {
    if (walletSecurity?.isWalletLocked) {
      secureWalletNavigationReset("wallet-lock");
    } else {
      releaseWalletNavigationLock();
    }
  }, [walletSecurity?.isWalletLocked]);

  useEffect(() => {
    const onPopState = () => {
      if (assertAndroidBackFromWalletBlocked("wallet")) {
        window.history.replaceState(null, "", `/${getPostLockSafeRoute()}`);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [walletSecurity?.isWalletLocked]);

  const hints = useMemo(
    () =>
      buildGrossisteSettlementHints({
        balance: balance.data,
        transactions: transactions.data ?? [],
        activity: activity.data ?? [],
      }),
    [balance.data, transactions.data, activity.data],
  );

  if (!walletEnabled) {
    return (
      <section data-testid="grossiste-wallet-disabled">
        <GrossisteScreenHeader title="Règlements" subtitle="Optionnel — bientôt disponible" />
        <p style={{ padding: 16, color: "#8fa39a", fontSize: 14 }}>
          Vos commandes et votre catalogue restent disponibles sans wallet.
        </p>
      </section>
    );
  }

  const content = (
    <>
      <GrossisteScreenHeader
        title="Règlements"
        subtitle="Mobile money, cash et confirmations terrain — simple et rapide."
      />
      {hints.map((h) => (
        <p key={h.id} className="grossiste-hint" data-testid="grossiste-wallet-hint" style={{ padding: "0 16px" }}>
          {h.text}
        </p>
      ))}
      <button
        type="button"
        className="grossiste-quick-btn"
        data-testid="grossiste-wallet-refresh"
        style={{ margin: "8px 16px", minHeight: 44 }}
        onClick={() => {
          clearCommerceWalletCache();
          balance.refresh();
          transactions.refresh();
          activity.refresh();
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
        testId="grossiste-b-commerce-wallet"
        accountSettings={accountSettings}
        actorRole="grossiste"
      />
    </>
  );

  return (
    <section data-testid="grossiste-screen-wallet">
      {walletSecurity ? (
        <WalletAdaptiveSecurityShell lockGateTestId="grossiste-wallet-lock-gate">
          {content}
        </WalletAdaptiveSecurityShell>
      ) : (
        content
      )}
    </section>
  );
});
