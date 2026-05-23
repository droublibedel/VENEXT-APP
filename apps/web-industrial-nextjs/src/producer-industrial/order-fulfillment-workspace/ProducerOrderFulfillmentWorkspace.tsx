"use client";

import { useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerCorridorExecutionPanel } from "./ProducerCorridorExecutionPanel";
import { ProducerDeliveryPerformancePanel } from "./ProducerDeliveryPerformancePanel";
import { ProducerFulfillmentFlowPanel } from "./ProducerFulfillmentFlowPanel";
import { ProducerIncidentSupervisionPanel } from "./ProducerIncidentSupervisionPanel";
import { ProducerOperationalInsightsPanel } from "./ProducerOperationalInsightsPanel";
import { ProducerOrdersOverviewPanel } from "./ProducerOrdersOverviewPanel";
import { ProducerProofTrackingPanel } from "./ProducerProofTrackingPanel";
import { useProducerOrderFulfillmentData } from "./useProducerOrderFulfillmentData";

type FulfillmentTab =
  | "orders"
  | "fulfillment"
  | "delivery"
  | "incidents"
  | "proofs"
  | "corridors"
  | "insights";

const TABS: { id: FulfillmentTab; label: string }[] = [
  { id: "orders", label: "Commandes" },
  { id: "fulfillment", label: "Fulfillment" },
  { id: "delivery", label: "Livraison" },
  { id: "incidents", label: "Incidents" },
  { id: "proofs", label: "Preuves" },
  { id: "corridors", label: "Corridors" },
  { id: "insights", label: "Insights" },
];

export function ProducerOrderFulfillmentWorkspace() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = hydrated && flags.producer_order_fulfillment_workspace_enabled !== false;
  const [activeTab, setActiveTab] = useState<FulfillmentTab>("orders");
  const { view, loading, error, dataSource, fallbackUsed, refresh } =
    useProducerOrderFulfillmentData(enabled);

  if (!enabled) {
    return (
      <section
        className="producer-industrial-card p-6 text-sm text-slate-400"
        data-testid="order-fulfillment-workspace-disabled"
      >
        L&apos;espace commandes &amp; fulfillment n&apos;est pas activé pour cet environnement.
      </section>
    );
  }

  const panelProps = { view, loading, error, dataSource, fallbackUsed };

  return (
    <section data-testid="producer-dashboard-order-fulfillment" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProducerSectionHeader
          kicker="Commandes & Fulfillment"
          title="Supervision de l'exécution réseau"
          subtitle="Commandes, livraisons, incidents, preuves terrain et corridors — lecture opérationnelle."
        />
        <button
          type="button"
          onClick={refresh}
          className="rounded border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
          data-testid="order-fulfillment-refresh"
        >
          Actualiser
        </button>
      </div>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <nav
        className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-1"
        aria-label="Sections commandes et fulfillment"
        data-testid="order-fulfillment-tabs"
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
            data-testid={`fulfillment-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === "orders" ? <ProducerOrdersOverviewPanel {...panelProps} /> : null}
        {activeTab === "fulfillment" ? <ProducerFulfillmentFlowPanel {...panelProps} /> : null}
        {activeTab === "delivery" ? <ProducerDeliveryPerformancePanel {...panelProps} /> : null}
        {activeTab === "incidents" ? <ProducerIncidentSupervisionPanel {...panelProps} /> : null}
        {activeTab === "proofs" ? <ProducerProofTrackingPanel {...panelProps} /> : null}
        {activeTab === "corridors" ? <ProducerCorridorExecutionPanel {...panelProps} /> : null}
        {activeTab === "insights" ? <ProducerOperationalInsightsPanel {...panelProps} /> : null}
      </div>
    </section>
  );
}
