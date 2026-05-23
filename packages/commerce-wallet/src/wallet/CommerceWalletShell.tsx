import { memo, useMemo, useState } from "react";

import { CommerceWalletGovernanceBadge } from "../governance/CommerceWalletGovernanceBadge";
import {
  defaultCommerceWalletSettings,
  resolveWalletGovernance,
} from "../governance/commerce-wallet-governance";
import {
  buildPaymentHints,
  buildSettlementActivitySignals,
  buildSettlementPartnerSignals,
  buildSettlementSignals,
  buildSettlementStabilityHints,
  buildWalletSignals,
} from "../intelligence/commerce-wallet-intelligence";
import {
  buildSettlementTimeline,
  transactionToSettlement,
} from "../settlements/commerce-settlement.helpers";
import { CommerceSettlementConfirmationPanel } from "../settlements/CommerceSettlementConfirmationPanel";
import { CommerceSettlementMethodCard } from "../settlements/CommerceSettlementMethodCard";
import { CommerceSettlementPartnerNotice } from "../settlements/CommerceSettlementPartnerNotice";
import { CommerceSettlementTimeline } from "../settlements/CommerceSettlementTimeline";
import type {
  CommerceWalletPanel,
  WalletActorRole,
} from "../hooks/commerce-wallet.types";
import type { CommerceWalletAccountSettings } from "../governance/commerce-wallet-governance.types";
import {
  useCommercePartnerPayments,
  useCommercePaymentActivity,
  useCommerceTransactions,
  useCommerceWalletBalance,
} from "../hooks/useCommerceWalletLiveData";
import { CommercePaymentActivityStrip } from "../payments/CommercePaymentActivityStrip";
import { CommercePaymentComposer } from "../payments/CommercePaymentComposer";
import { CommercePartnerPaymentCard } from "../payments/CommercePartnerPaymentCard";
import { CommercePaymentStatusCard } from "../payments/CommercePaymentStatusCard";
import { CommerceTransactionList } from "../payments/CommerceTransactionList";
import { CommerceWalletBalanceCard } from "./CommerceWalletBalanceCard";
import { CommerceWalletMobileTabs } from "./CommerceWalletMobileTabs";
import { CommerceWalletSidebar } from "./CommerceWalletSidebar";

export type CommerceWalletShellProps = {
  enabled?: boolean;
  liveEnabled?: boolean;
  governanceEnabled?: boolean;
  layout?: "desktop" | "mobile";
  testId?: string;
  /** Actor-specific wallet settings (hybrid/manual flags, default mode). */
  accountSettings?: Partial<CommerceWalletAccountSettings>;
  /** Filter mock/live transactions to one actor profile. */
  actorRole?: WalletActorRole | WalletActorRole[];
};

export const CommerceWalletShell = memo(function CommerceWalletShell({
  enabled = true,
  liveEnabled = false,
  governanceEnabled = true,
  layout = "desktop",
  testId = "commerce-wallet-shell",
  accountSettings: accountSettingsProp,
  actorRole,
}: CommerceWalletShellProps) {
  const opts = { enabled, liveEnabled };
  const balance = useCommerceWalletBalance(opts);
  const transactions = useCommerceTransactions(opts);
  const partnerPayments = useCommercePartnerPayments(opts);
  const activity = useCommercePaymentActivity(opts);

  const [activePanel, setActivePanel] = useState<CommerceWalletPanel>("overview");
  const [activeTxId, setActiveTxId] = useState<string | null>(null);

  const loading =
    balance.loading || transactions.loading || partnerPayments.loading || activity.loading;
  const fallbackUsed =
    balance.fallbackUsed ||
    transactions.fallbackUsed ||
    partnerPayments.fallbackUsed ||
    activity.fallbackUsed;
  const dataSource =
    balance.dataSource === "live" &&
    transactions.dataSource === "live" &&
    !fallbackUsed
      ? "live"
      : fallbackUsed
        ? "fallback"
        : "mixed";

  const refresh = () => {
    balance.refresh();
    transactions.refresh();
    partnerPayments.refresh();
    activity.refresh();
  };

  const txList = useMemo(() => {
    const all = transactions.data ?? [];
    if (!actorRole) return all;
    const roles = Array.isArray(actorRole) ? actorRole : [actorRole];
    return all.filter((t) => !t.actorRole || roles.includes(t.actorRole));
  }, [transactions.data, actorRole]);
  const defaultTxId =
    txList.find((t) => t.status === "pending" && t.settlementMethod)?.id ??
    txList.find((t) => t.status === "pending")?.id ??
    txList[0]?.id ??
    null;
  const resolvedTxId = activeTxId ?? defaultTxId;
  const activeTx = useMemo(
    () => txList.find((t) => t.id === resolvedTxId) ?? null,
    [txList, resolvedTxId],
  );

  const account = useMemo(() => {
    const base = { ...defaultCommerceWalletSettings(), ...accountSettingsProp };
    return {
      ...base,
      authorizedPartnerIds: (partnerPayments.data ?? []).map((p) => p.id),
    };
  }, [partnerPayments.data, accountSettingsProp]);

  const governance = useMemo(() => {
    if (!governanceEnabled) {
      return resolveWalletGovernance({ account });
    }
    if (activePanel === "partners") {
      return resolveWalletGovernance({ account });
    }
    const order = activeTx?.orderId
      ? {
          orderId: activeTx.orderId,
          scope:
            activeTx.status === "pending"
              ? ("open" as const)
              : activeTx.status === "settled"
                ? ("readonly" as const)
                : ("settlement-only" as const),
          walletMode: activeTx.kind === "commande" ? ("ORDER_LINKED" as const) : undefined,
        }
      : null;
    return resolveWalletGovernance({
      account,
      order,
      settlementMethod: activeTx?.settlementMethod,
    });
  }, [governanceEnabled, account, activeTx, activePanel]);

  const activeSettlement = useMemo(
    () => (activeTx ? transactionToSettlement(activeTx) : null),
    [activeTx],
  );

  const settlementTimeline = useMemo(
    () => (activeSettlement ? buildSettlementTimeline(activeSettlement) : []),
    [activeSettlement],
  );

  const hints = useMemo(
    () =>
      [
        ...buildWalletSignals(balance.data),
        ...buildPaymentHints(txList),
        ...buildSettlementSignals(activity.data ?? []),
        ...buildSettlementActivitySignals(txList),
        ...buildSettlementStabilityHints(balance.data, activity.data ?? []),
        ...buildSettlementPartnerSignals(partnerPayments.data ?? [], txList),
      ].slice(0, 4),
    [balance.data, txList, activity.data, partnerPayments.data],
  );

  const isMobile = layout === "mobile";

  if (!enabled) {
    return (
      <div className="cw-shell cw-shell--disabled" data-testid="commerce-wallet-disabled">
        <p>Règlements commerciaux — bientôt disponible.</p>
      </div>
    );
  }

  return (
    <div
      className={`cw-shell${isMobile ? " cw-shell--mobile" : ""}`}
      data-testid={testId}
      data-layout={layout}
    >
      {!isMobile ? (
        <CommerceWalletSidebar
          activePanel={activePanel}
          onSelect={setActivePanel}
          dataSource={dataSource}
          fallbackUsed={fallbackUsed}
        />
      ) : (
        <CommerceWalletMobileTabs activePanel={activePanel} onSelect={setActivePanel} />
      )}

      <div className="cw-main" data-testid={`cw-panel-active-${activePanel}`}>
        <header className="cw-main-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Règlements commerce</h2>
            {governanceEnabled ? (
              <CommerceWalletGovernanceBadge mode={governance.mode} />
            ) : null}
          </div>
          <button
            type="button"
            data-testid="cw-refresh"
            onClick={refresh}
            disabled={loading}
            className="cw-refresh"
          >
            Actualiser
          </button>
        </header>

        {hints.slice(0, 3).map((h) => (
          <p key={h.id} className="cw-hint" data-testid="cw-intelligence-hint">
            {h.text}
          </p>
        ))}

        {activePanel === "overview" ? (
          <>
            <CommerceWalletBalanceCard balance={balance.data} />
            <CommercePaymentActivityStrip activities={activity.data ?? []} />
          </>
        ) : null}

        {activePanel === "transactions" ? (
          <>
            <CommerceTransactionList
              transactions={txList}
              activeId={resolvedTxId}
              onSelect={setActiveTxId}
            />
            {activeSettlement ? (
              <>
                <CommerceSettlementMethodCard settlement={activeSettlement} />
                <CommerceSettlementTimeline steps={settlementTimeline} />
                <CommerceSettlementPartnerNotice
                  partnerName={activeSettlement.partnerName}
                  confirmed={activeSettlement.partnerConfirmed}
                  required={activeSettlement.partnerConfirmationRequired}
                />
              </>
            ) : null}
            <CommercePaymentStatusCard transaction={activeTx} governance={governance} />
          </>
        ) : null}

        {activePanel === "payments" ? (
          <>
            <CommercePaymentStatusCard transaction={activeTx} governance={governance} />
            {activeSettlement ? (
              <CommerceSettlementMethodCard settlement={activeSettlement} />
            ) : null}
            <CommercePaymentComposer
              governance={governance}
              variant={isMobile ? "mobile" : "default"}
            />
            <CommerceSettlementConfirmationPanel governance={governance} />
          </>
        ) : null}

        {activePanel === "partners" && governance.partnerPaymentsVisible ? (
          <div className="cw-partner-list" data-testid="cw-partner-list">
            {(partnerPayments.data ?? []).map((p) => (
              <CommercePartnerPaymentCard key={p.id} payment={p} />
            ))}
          </div>
        ) : null}

        {activePanel === "partners" && !governance.partnerPaymentsVisible ? (
          <p className="cw-composer-hidden" data-testid="cw-partners-hidden">
            Paiements partenaires non disponibles pour ce mode.
          </p>
        ) : null}
      </div>
    </div>
  );
});
