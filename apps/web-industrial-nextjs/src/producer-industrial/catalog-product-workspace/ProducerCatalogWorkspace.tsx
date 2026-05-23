"use client";

import { useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerCatalogOverviewPanel } from "./ProducerCatalogOverviewPanel";
import { ProducerDemandPressurePanel } from "./ProducerDemandPressurePanel";
import { ProducerInventoryRotationPanel } from "./ProducerInventoryRotationPanel";
import { ProducerProductInsightsPanel } from "./ProducerProductInsightsPanel";
import { ProducerProductPerformancePanel } from "./ProducerProductPerformancePanel";
import { ProducerProductRecommendationsPanel } from "./ProducerProductRecommendationsPanel";
import { ProducerTerritoryCoveragePanel } from "./ProducerTerritoryCoveragePanel";
import { useProducerCatalogWorkspaceData } from "./useProducerCatalogWorkspaceData";

type CatalogTab =
  | "overview"
  | "performance"
  | "demand"
  | "rotation"
  | "territory"
  | "recommendations"
  | "insights";

const TABS: { id: CatalogTab; label: string }[] = [
  { id: "overview", label: "Vue catalogue" },
  { id: "performance", label: "Performance" },
  { id: "demand", label: "Demande" },
  { id: "rotation", label: "Rotation" },
  { id: "territory", label: "Territoires" },
  { id: "recommendations", label: "Recommandations" },
  { id: "insights", label: "Insights" },
];

export function ProducerCatalogWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = hydrated && flags.producer_catalog_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<CatalogTab>("overview");
  const { view, map, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerCatalogWorkspaceData(enabled);

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="catalog-workspace-disabled"
      >
        L&apos;espace catalogue &amp; produits n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-catalog-products" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Catalogue & Produits"
          title="Intelligence catalogue terrain"
          subtitle="Performance produits, tension demande, rotation et couverture réseau."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="catalog-workspace-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections catalogue"
        data-testid="catalog-workspace-tabs"
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
            data-testid={`catalog-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "overview" ? <ProducerCatalogOverviewPanel {...panelProps} /> : null}
        {activeTab === "performance" ? <ProducerProductPerformancePanel {...panelProps} /> : null}
        {activeTab === "demand" ? <ProducerDemandPressurePanel {...panelProps} /> : null}
        {activeTab === "rotation" ? <ProducerInventoryRotationPanel {...panelProps} /> : null}
        {activeTab === "territory" ? (
          <ProducerTerritoryCoveragePanel {...panelProps} map={map} />
        ) : null}
        {activeTab === "recommendations" ? <ProducerProductRecommendationsPanel {...panelProps} /> : null}
        {activeTab === "insights" ? <ProducerProductInsightsPanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
