"use client";

import { memo, useMemo, useState } from "react";

import {
  clearCommerceWalletCache,
  CommerceWalletShell,
  useCommercePartnerPayments,
  useCommercePaymentActivity,
  useCommerceTransactions,
  useCommerceWalletBalance,
} from "commerce-wallet";
import "commerce-wallet/styles.css";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerBankTransferPanel } from "./ProducerBankTransferPanel";
import { ProducerPartnerSettlementPanel } from "./ProducerPartnerSettlementPanel";
import { ProducerSettlementInsightsPanel } from "./ProducerSettlementInsightsPanel";
import { ProducerSettlementOverviewPanel } from "./ProducerSettlementOverviewPanel";
import { ProducerSettlementTimelinePanel } from "./ProducerSettlementTimelinePanel";
import { buildProducerSettlementHints } from "./producer-wallet-intelligence";
import { producerWalletAccountSettings } from "./producer-wallet-governance";

type ProducerWalletTab =
  | "overview"
  | "transfers"
  | "partners"
  | "timeline"
  | "insights"
  | "activity";

const TABS: { id: ProducerWalletTab; label: string }[] = [
  { id: "overview", label: "Activité règlement" },
  { id: "transfers", label: "Virements" },
  { id: "partners", label: "Partenaires" },
  { id: "timeline", label: "Confirmation" },
  { id: "insights", label: "Signaux" },
  { id: "activity", label: "Flux détaillé" },
];

export const ProducerWalletWorkspace = memo(function ProducerWalletWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const walletEnabled = hydrated && flags.producer_wallet_enabled !== false;
  const [activeTab, setActiveTab] = useState<ProducerWalletTab>("overview");

  const accountSettings = useMemo(() => producerWalletAccountSettings(flags), [flags]);
  const opts = { enabled: walletEnabled, liveEnabled: false };

  const balance = useCommerceWalletBalance(opts);
  const transactions = useCommerceTransactions(opts);
  const partners = useCommercePartnerPayments(opts);
  const activity = useCommercePaymentActivity(opts);

  const producerTx = useMemo(
    () => (transactions.data ?? []).filter((t) => t.actorRole === "producteur"),
    [transactions.data],
  );

  const hints = useMemo(
    () =>
      buildProducerSettlementHints({
        balance: balance.data,
        transactions: producerTx,
        partners: partners.data ?? [],
        activity: activity.data ?? [],
      }),
    [balance.data, producerTx, partners.data, activity.data],
  );

  if (!walletEnabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="producer-wallet-disabled"
      >
        Règlements partenaires — optionnel, non activé pour cet environnement.
      </section>
    );
  }

  return (
    <section className="space-y-4" data-testid="producer-wallet-workspace">
      <ProducerSectionHeader
        kicker="Règlements partenaires"
        title="Activité de règlement"
        subtitle="Flux commerciaux, virements réseau et confirmations terrain — sans imposer de paiement électronique."
      />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections règlements"
        data-testid="producer-wallet-tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded-md px-3 py-1.5 text-[11px] transition-colors ${
              activeTab === tab.id
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-slate-500 hover:bg-slate-900/80 hover:text-slate-200"
            }`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`producer-wallet-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto rounded-md border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-400"
          data-testid="producer-wallet-refresh"
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
      </nav>

      <div className="min-h-[280px]">
        {activeTab === "overview" ? (
          <ProducerSettlementOverviewPanel
            balance={balance.data}
            activity={activity.data ?? []}
            hints={hints}
          />
        ) : null}
        {activeTab === "transfers" ? <ProducerBankTransferPanel transactions={producerTx} /> : null}
        {activeTab === "partners" ? (
          <ProducerPartnerSettlementPanel partners={partners.data ?? []} />
        ) : null}
        {activeTab === "timeline" ? <ProducerSettlementTimelinePanel transactions={producerTx} /> : null}
        {activeTab === "insights" ? <ProducerSettlementInsightsPanel hints={hints} /> : null}
        {activeTab === "activity" ? (
          <CommerceWalletShell
            enabled
            liveEnabled={false}
            governanceEnabled
            layout="desktop"
            testId="producer-commerce-wallet-shell"
            accountSettings={accountSettings}
            actorRole="producteur"
          />
        ) : null}
      </div>
    </section>
  );
});
