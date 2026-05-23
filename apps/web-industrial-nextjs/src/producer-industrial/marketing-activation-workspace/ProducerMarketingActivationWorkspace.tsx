"use client";

import { useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerActivationOverviewPanel } from "./ProducerActivationOverviewPanel";
import { ProducerActivationTerritoryPanel } from "./ProducerActivationTerritoryPanel";
import { ProducerCampaignDynamicsPanel } from "./ProducerCampaignDynamicsPanel";
import { ProducerDistributorActivationPanel } from "./ProducerDistributorActivationPanel";
import { ProducerMarketPressurePanel } from "./ProducerMarketPressurePanel";
import { ProducerMarketingInsightsPanel } from "./ProducerMarketingInsightsPanel";
import { ProducerProductMomentumPanel } from "./ProducerProductMomentumPanel";
import { useProducerMarketingWorkspaceData } from "./useProducerMarketingWorkspaceData";

type MarketingTab =
  | "overview"
  | "campaigns"
  | "momentum"
  | "territory"
  | "distributors"
  | "pressure"
  | "insights";

const TABS: { id: MarketingTab; label: string }[] = [
  { id: "overview", label: "Vue activation" },
  { id: "campaigns", label: "Campagnes" },
  { id: "momentum", label: "Momentum" },
  { id: "territory", label: "Territoires" },
  { id: "distributors", label: "Distributeurs" },
  { id: "pressure", label: "Pression marché" },
  { id: "insights", label: "Insights" },
];

export function ProducerMarketingActivationWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = hydrated && flags.producer_marketing_activation_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<MarketingTab>("overview");
  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerMarketingWorkspaceData(enabled);

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="marketing-workspace-disabled"
      >
        L&apos;espace marketing &amp; activation n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-marketing-activation-workspace" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Marketing & Activation"
          title="Activation terrain & visibilité produits"
          subtitle="Ce qui pousse sur le réseau, les zones qui réagissent et les distributeurs actifs."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="marketing-workspace-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections marketing"
        data-testid="marketing-workspace-tabs"
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
            data-testid={`marketing-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "overview" ? <ProducerActivationOverviewPanel {...panelProps} /> : null}
        {activeTab === "campaigns" ? <ProducerCampaignDynamicsPanel {...panelProps} /> : null}
        {activeTab === "momentum" ? <ProducerProductMomentumPanel {...panelProps} /> : null}
        {activeTab === "territory" ? <ProducerActivationTerritoryPanel {...panelProps} /> : null}
        {activeTab === "distributors" ? <ProducerDistributorActivationPanel {...panelProps} /> : null}
        {activeTab === "pressure" ? <ProducerMarketPressurePanel {...panelProps} /> : null}
        {activeTab === "insights" ? <ProducerMarketingInsightsPanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
