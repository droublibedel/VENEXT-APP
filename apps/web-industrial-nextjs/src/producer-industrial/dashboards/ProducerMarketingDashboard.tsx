"use client";

import { useProducerMarketingActivation } from "../hooks/useProducerIndustrialLiveData";
import { PRODUCER_PRODUCT_SIGNALS } from "../mocks/industrial-mock-data";
import { ProducerDashboardGrid } from "../shared/ProducerDashboardGrid";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerMetricCard } from "../shared/ProducerMetricCard";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";

export function ProducerMarketingDashboard() {
  const { data, loading, dataSource, fallbackUsed } = useProducerMarketingActivation();
  const products = data?.products?.length ? data.products : PRODUCER_PRODUCT_SIGNALS;
  const rising = data?.trendingProducts ?? products.filter((p) => p.momentum === "rising").length;
  const avgPressure =
    data?.demandPressurePct ??
    Math.round(products.reduce((s, p) => s + p.demandPressure, 0) / Math.max(products.length, 1));

  return (
    <section data-testid="producer-dashboard-marketing">
      <ProducerSectionHeader
        kicker="Marketing & Activation"
        title="Activation commerciale & momentum produits"
        subtitle="Tendances, engagement réseau et corridors d'activation."
      />
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <ProducerDashboardGrid columns={4}>
        <ProducerMetricCard label="Produits tendance" value={rising} hint="Momentum haussier" accent="signal" />
        <ProducerMetricCard label="Pression demande" value={`${avgPressure}%`} />
        <ProducerMetricCard
          label="Corridors activation"
          value={data?.activationCorridors ?? products.length}
          hint="Territoires couverts"
        />
        <ProducerMetricCard
          label="Rotation commerciale"
          value={`${data?.campaignRotationPct ?? 94}%`}
          hint="Objectif campagne"
          trend="up"
        />
      </ProducerDashboardGrid>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {products.map((p) => (
          <li key={p.id} className="producer-industrial-card flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-slate-100">{p.name}</p>
              <p className="text-[10px] text-slate-500">{p.category}</p>
            </div>
            <span
              className={
                p.momentum === "rising"
                  ? "text-emerald-400"
                  : p.momentum === "cooling"
                    ? "text-slate-500"
                    : "text-slate-300"
              }
            >
              {p.momentum === "rising" ? "↑ Hausse" : p.momentum === "cooling" ? "↓ Refroid." : "→ Stable"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
