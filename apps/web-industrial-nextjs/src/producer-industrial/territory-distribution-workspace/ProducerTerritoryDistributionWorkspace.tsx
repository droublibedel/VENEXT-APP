"use client";

import { useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerCoverageOpportunitiesPanel } from "./ProducerCoverageOpportunitiesPanel";
import { ProducerDistributionCorridorPanel } from "./ProducerDistributionCorridorPanel";
import { ProducerDistributorDynamicsPanel } from "./ProducerDistributorDynamicsPanel";
import { ProducerRegionalPerformancePanel } from "./ProducerRegionalPerformancePanel";
import { ProducerTerritoryActivityPanel } from "./ProducerTerritoryActivityPanel";
import { ProducerTerritoryInsightsPanel } from "./ProducerTerritoryInsightsPanel";
import { ProducerTerritoryOverviewPanel } from "./ProducerTerritoryOverviewPanel";
import { useProducerTerritoryWorkspaceData } from "./useProducerTerritoryWorkspaceData";

type TerritoryTab =
  | "overview"
  | "corridors"
  | "activity"
  | "distributors"
  | "regions"
  | "opportunities"
  | "insights";

const TABS: { id: TerritoryTab; label: string }[] = [
  { id: "overview", label: "Vue territoires" },
  { id: "corridors", label: "Corridors" },
  { id: "activity", label: "Activité" },
  { id: "distributors", label: "Distributeurs" },
  { id: "regions", label: "Régions" },
  { id: "opportunities", label: "Opportunités" },
  { id: "insights", label: "Insights" },
];

export function ProducerTerritoryDistributionWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = hydrated && flags.producer_territory_distribution_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<TerritoryTab>("overview");
  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerTerritoryWorkspaceData(enabled);

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="territory-workspace-disabled"
      >
        L&apos;espace territoires &amp; distribution n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-territory-distribution" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Territoires & Distribution"
          title="Intelligence territoriale réseau"
          subtitle="Où l'activité est forte, quels corridors bougent et quelles zones méritent attention."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="territory-workspace-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections territoires"
        data-testid="territory-workspace-tabs"
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
            data-testid={`territory-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "overview" ? <ProducerTerritoryOverviewPanel {...panelProps} /> : null}
        {activeTab === "corridors" ? <ProducerDistributionCorridorPanel {...panelProps} /> : null}
        {activeTab === "activity" ? <ProducerTerritoryActivityPanel {...panelProps} /> : null}
        {activeTab === "distributors" ? <ProducerDistributorDynamicsPanel {...panelProps} /> : null}
        {activeTab === "regions" ? <ProducerRegionalPerformancePanel {...panelProps} /> : null}
        {activeTab === "opportunities" ? <ProducerCoverageOpportunitiesPanel {...panelProps} /> : null}
        {activeTab === "insights" ? <ProducerTerritoryInsightsPanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
