"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerCollectionsPerformancePanel } from "./ProducerCollectionsPerformancePanel";
import { ProducerFinanceCoveragePanel } from "./ProducerFinanceCoveragePanel";
import { ProducerFinanceInsightsPanel } from "./ProducerFinanceInsightsPanel";
import { ProducerFinanceOverviewPanel } from "./ProducerFinanceOverviewPanel";
import { ProducerPartnerRiskPanel } from "./ProducerPartnerRiskPanel";
import { ProducerPaymentStabilityPanel } from "./ProducerPaymentStabilityPanel";
import { ProducerRevenueDistributionPanel } from "./ProducerRevenueDistributionPanel";
import { useProducerFinanceWorkspaceData } from "./useProducerFinanceWorkspaceData";

const ProducerWalletWorkspace = dynamic(
  () =>
    import("../producer-wallet-workspace/ProducerWalletWorkspace").then((m) => ({
      default: m.ProducerWalletWorkspace,
    })),
  { ssr: false },
);

type FinanceTab =
  | "overview"
  | "collections"
  | "settlements"
  | "stability"
  | "risk"
  | "revenue"
  | "coverage"
  | "insights";

const TABS: { id: FinanceTab; label: string }[] = [
  { id: "overview", label: "Vue finance" },
  { id: "collections", label: "Encaissements" },
  { id: "settlements", label: "Règlements partenaires" },
  { id: "stability", label: "Stabilité" },
  { id: "risk", label: "Risques" },
  { id: "revenue", label: "Revenus" },
  { id: "coverage", label: "Couverture" },
  { id: "insights", label: "Insights" },
];

export function ProducerFinanceCollectionsWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = hydrated && flags.producer_finance_collections_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerFinanceWorkspaceData(enabled);

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="finance-workspace-disabled"
      >
        L&apos;espace finance &amp; encaissements n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-finance-collections-workspace" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Finance & Encaissements"
          title="Stabilité financière du réseau"
          subtitle="Ce qui entre, ce qui ralentit, où est le risque et où est la stabilité."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="finance-workspace-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections finance"
        data-testid="finance-workspace-tabs"
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
            data-testid={`finance-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "overview" ? <ProducerFinanceOverviewPanel {...panelProps} /> : null}
        {activeTab === "collections" ? <ProducerCollectionsPerformancePanel {...panelProps} /> : null}
        {activeTab === "settlements" && flags.producer_wallet_enabled !== false ? (
          <ProducerWalletWorkspace />
        ) : null}
        {activeTab === "stability" ? <ProducerPaymentStabilityPanel {...panelProps} /> : null}
        {activeTab === "risk" ? <ProducerPartnerRiskPanel {...panelProps} /> : null}
        {activeTab === "revenue" ? <ProducerRevenueDistributionPanel {...panelProps} /> : null}
        {activeTab === "coverage" ? <ProducerFinanceCoveragePanel {...panelProps} /> : null}
        {activeTab === "insights" ? <ProducerFinanceInsightsPanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
