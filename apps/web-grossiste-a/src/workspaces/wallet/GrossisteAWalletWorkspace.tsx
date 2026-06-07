import { memo, useMemo } from "react";

import { CommerceWalletShell } from "commerce-wallet";
import "commerce-wallet/styles.css";

import { useGrossisteAFeatureFlags } from "../../hooks/useGrossisteAFeatureFlags";
import { buildGrossisteSettlementHints } from "./grossiste-a-wallet-intelligence";
import { grossisteAWalletAccountSettings } from "./grossiste-a-wallet-governance";
import {
  clearCommerceWalletCache,
  resolveWalletLiveEnabled,
  useCommercePartnerPayments,
  useCommercePaymentActivity,
  useCommerceTransactions,
  useCommerceWalletBalance,
} from "commerce-wallet";
import { useWalletPlatformSync } from "venext-auth-foundation";

export const GrossisteAWalletWorkspace = memo(function GrossisteAWalletWorkspace({
  enabled,
}: {
  enabled: boolean;
  routingInput?: import("commercial-context-routing").CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const walletEnabled =
    hydrated && enabled && flags.grossiste_a_wallet_enabled !== false;

  const organizationId = "org-grossiste-a-nord-plus";
  const liveEnabled = resolveWalletLiveEnabled({
    walletEnabled: flags.grossiste_a_wallet_enabled !== false,
    bffRoutesEnabled: flags.venext_bff_routes_enabled !== false,
    backendPersistenceEnabled: flags.venext_backend_persistence_enabled !== false,
    organizationId,
  });
  const accountSettings = useMemo(() => grossisteAWalletAccountSettings(flags), [flags]);
  const opts = { enabled: walletEnabled, liveEnabled };
  useWalletPlatformSync({ organizationId, enabled: walletEnabled, liveEnabled });

  const balance = useCommerceWalletBalance(opts);
  const transactions = useCommerceTransactions(opts);
  const partners = useCommercePartnerPayments(opts);
  const activity = useCommercePaymentActivity(opts);

  const hints = useMemo(
    () =>
      buildGrossisteSettlementHints({
        balance: balance.data,
        transactions: transactions.data ?? [],
        partners: partners.data ?? [],
        activity: activity.data ?? [],
      }),
    [balance.data, transactions.data, partners.data, activity.data],
  );

  if (!walletEnabled) {
    return (
      <div className="ga-workspace-muted" data-testid="ga-wallet-disabled">
        <p>Règlements commerciaux — optionnel, disponible prochainement.</p>
      </div>
    );
  }

  return (
    <div className="ga-workspace" data-testid="ga-workspace-wallet">
      <header className="ga-workspace-header">
        <h1>Règlements commerciaux</h1>
        <p>Structurez votre activité — partenaires, virements et mobile money.</p>
        <button
          type="button"
          className="ga-refresh"
          data-testid="ga-wallet-refresh"
          onClick={() => {
            clearCommerceWalletCache();
            balance.refresh();
            transactions.refresh();
            partners.refresh();
            activity.refresh();
          }}
        >
          Actualiser
        </button>
      </header>
      {hints.slice(0, 2).map((h) => (
        <p key={h.id} className="ga-hint" data-testid="ga-wallet-hint">
          {h.text}
        </p>
      ))}
      <p className="ga-optional-note" data-testid="ga-wallet-optional-note">
        Le règlement reste optionnel — vos commandes et votre catalogue fonctionnent sans wallet.
      </p>
      <CommerceWalletShell
        enabled
        liveEnabled={false}
        governanceEnabled
        layout="desktop"
        testId="grossiste-a-commerce-wallet"
        accountSettings={accountSettings}
        actorRole={["grossiste", "grossiste-importateur"]}
      />
    </div>
  );
});
