"use client";

import { useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerActivityAnomaliesPanel } from "./ProducerActivityAnomaliesPanel";
import { ProducerCorridorWatchPanel } from "./ProducerCorridorWatchPanel";
import { ProducerIntelligenceOverviewPanel } from "./ProducerIntelligenceOverviewPanel";
import { ProducerIntelligencePresencePanel } from "./ProducerIntelligencePresencePanel";
import { ProducerMarketAttentionPanel } from "./ProducerMarketAttentionPanel";
import { ProducerNetworkSignalsPanel } from "./ProducerNetworkSignalsPanel";
import { ProducerPriorityInsightsPanel } from "./ProducerPriorityInsightsPanel";
import { ProducerStrategicSuggestionsPanel } from "./ProducerStrategicSuggestionsPanel";
import { useProducerIntelligenceWorkspaceData } from "./useProducerIntelligenceWorkspaceData";

type IntelligenceTab =
  | "overview"
  | "signals"
  | "attention"
  | "suggestions"
  | "anomalies"
  | "corridor"
  | "insights"
  | "presence";

const TABS: { id: IntelligenceTab; label: string }[] = [
  { id: "overview", label: "Vue" },
  { id: "signals", label: "Signaux" },
  { id: "attention", label: "Attention" },
  { id: "suggestions", label: "Suggestions" },
  { id: "anomalies", label: "Variations" },
  { id: "corridor", label: "Corridors" },
  { id: "insights", label: "Priorités" },
  { id: "presence", label: "Présence" },
];

export function ProducerDataIntelligenceWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = hydrated && flags.producer_data_intelligence_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("overview");
  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerIntelligenceWorkspaceData(enabled);

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="intelligence-workspace-disabled"
      >
        L&apos;espace data &amp; intelligence n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-data-intelligence-workspace" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Data & Intelligence"
          title="Intelligence réseau accessible"
          subtitle="VENEXT remarque des choses utiles — sans remplacer votre jugement terrain."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="intelligence-workspace-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections intelligence"
        data-testid="intelligence-workspace-tabs"
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
            data-testid={`intelligence-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "overview" ? <ProducerIntelligenceOverviewPanel {...panelProps} /> : null}
        {activeTab === "signals" ? <ProducerNetworkSignalsPanel {...panelProps} /> : null}
        {activeTab === "attention" ? <ProducerMarketAttentionPanel {...panelProps} /> : null}
        {activeTab === "suggestions" ? <ProducerStrategicSuggestionsPanel {...panelProps} /> : null}
        {activeTab === "anomalies" ? <ProducerActivityAnomaliesPanel {...panelProps} /> : null}
        {activeTab === "corridor" ? <ProducerCorridorWatchPanel {...panelProps} /> : null}
        {activeTab === "insights" ? <ProducerPriorityInsightsPanel {...panelProps} /> : null}
        {activeTab === "presence" ? <ProducerIntelligencePresencePanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
