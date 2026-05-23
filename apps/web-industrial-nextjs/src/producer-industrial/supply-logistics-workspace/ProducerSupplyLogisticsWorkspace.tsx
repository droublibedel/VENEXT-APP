"use client";

import { useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerDeliveryTensionPanel } from "./ProducerDeliveryTensionPanel";
import { ProducerFlowStabilityPanel } from "./ProducerFlowStabilityPanel";
import { ProducerHubActivityPanel } from "./ProducerHubActivityPanel";
import { ProducerLogisticsCorridorPanel } from "./ProducerLogisticsCorridorPanel";
import { ProducerSupplyCoveragePanel } from "./ProducerSupplyCoveragePanel";
import { ProducerSupplyInsightsPanel } from "./ProducerSupplyInsightsPanel";
import { ProducerSupplyOverviewPanel } from "./ProducerSupplyOverviewPanel";
import { useProducerSupplyWorkspaceData } from "./useProducerSupplyWorkspaceData";

type SupplyTab =
  | "overview"
  | "corridors"
  | "flows"
  | "hubs"
  | "delivery"
  | "coverage"
  | "insights";

const TABS: { id: SupplyTab; label: string }[] = [
  { id: "overview", label: "Vue supply" },
  { id: "corridors", label: "Corridors" },
  { id: "flows", label: "Flux" },
  { id: "hubs", label: "Hubs" },
  { id: "delivery", label: "Livraisons" },
  { id: "coverage", label: "Carte" },
  { id: "insights", label: "Insights" },
];

export function ProducerSupplyLogisticsWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = hydrated && flags.producer_supply_logistics_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<SupplyTab>("overview");
  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerSupplyWorkspaceData(enabled);

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="supply-workspace-disabled"
      >
        L&apos;espace supply &amp; logistique n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-supply-logistics-workspace" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Supply & Logistique"
          title="Flux logistiques & exécution terrain"
          subtitle="Où les flux ralentissent, quels corridors tiennent et quels hubs sont actifs."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="supply-workspace-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections supply"
        data-testid="supply-workspace-tabs"
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
            data-testid={`supply-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "overview" ? <ProducerSupplyOverviewPanel {...panelProps} /> : null}
        {activeTab === "corridors" ? <ProducerLogisticsCorridorPanel {...panelProps} /> : null}
        {activeTab === "flows" ? <ProducerFlowStabilityPanel {...panelProps} /> : null}
        {activeTab === "hubs" ? <ProducerHubActivityPanel {...panelProps} /> : null}
        {activeTab === "delivery" ? <ProducerDeliveryTensionPanel {...panelProps} /> : null}
        {activeTab === "coverage" ? <ProducerSupplyCoveragePanel {...panelProps} /> : null}
        {activeTab === "insights" ? <ProducerSupplyInsightsPanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
