"use client";

import { useEffect, useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { useProducerCommercialRouting } from "../routing/ProducerCommercialRoutingContext";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { RelationalCommercialActivityPanel } from "./RelationalCommercialActivityPanel";
import { RelationalCommercialInsightsPanel } from "./RelationalCommercialInsightsPanel";
import { RelationalCorridorPressurePanel } from "./RelationalCorridorPressurePanel";
import { ProducerCommercialDelivery } from "../commercial-delivery-workspace/ProducerCommercialDelivery";
import { ProducerRelationalOrders } from "../relational-orders-workspace/ProducerRelationalOrders";
import { RelationalOrdersFlowPanel } from "./RelationalOrdersFlowPanel";
import { RelationalPartnerNetworkPanel } from "./RelationalPartnerNetworkPanel";
import { RelationalProductRotationPanel } from "./RelationalProductRotationPanel";
import { RelationalTerritoryCoveragePanel } from "./RelationalTerritoryCoveragePanel";
import { useRelationalCommercialWorkspaceData } from "./useRelationalCommercialWorkspaceData";

type WorkspaceTab =
  | "partners"
  | "orders"
  | "corridors"
  | "activity"
  | "products"
  | "territory"
  | "insights";

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "partners", label: "Partenaires" },
  { id: "orders", label: "Commandes" },
  { id: "corridors", label: "Corridors" },
  { id: "activity", label: "Activité" },
  { id: "products", label: "Produits" },
  { id: "territory", label: "Territoires" },
  { id: "insights", label: "Insights" },
];

export function RelationalCommercialWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { relationalTab, setRelationalTab } = useProducerCommercialRouting();
  const enabled = hydrated && flags.producer_relational_commercial_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("partners");

  useEffect(() => {
    if (relationalTab) setActiveTab(relationalTab);
  }, [relationalTab]);
  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useRelationalCommercialWorkspaceData(enabled);

  if (!enabled) {
    return (
      <section className="producer-industrial-card p-6 text-sm text-slate-400" data-testid="relational-workspace-disabled">
        L&apos;espace réseau commercial n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-relational-commercial" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Réseau Commercial"
          title="Supervision opérationnelle du réseau"
          subtitle="Partenaires, commandes, corridors et territoires — lecture terrain en temps réel."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="relational-workspace-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections réseau commercial"
        data-testid="relational-workspace-tabs"
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
            onClick={() => {
              setActiveTab(tab.id);
              setRelationalTab?.(tab.id);
            }}
            data-testid={`relational-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "partners" ? <RelationalPartnerNetworkPanel {...panelProps} /> : null}
        {activeTab === "orders" ? (
          <>
            <ProducerRelationalOrders enabled={enabled} />
            <ProducerCommercialDelivery enabled={enabled} />
            <RelationalOrdersFlowPanel {...panelProps} />
          </>
        ) : null}
        {activeTab === "corridors" ? <RelationalCorridorPressurePanel {...panelProps} /> : null}
        {activeTab === "activity" ? <RelationalCommercialActivityPanel {...panelProps} /> : null}
        {activeTab === "products" ? <RelationalProductRotationPanel {...panelProps} /> : null}
        {activeTab === "territory" ? <RelationalTerritoryCoveragePanel {...panelProps} /> : null}
        {activeTab === "insights" ? <RelationalCommercialInsightsPanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
