"use client";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import { useProducerCommercialNetwork, useProducerMapControl } from "../hooks/useProducerIndustrialLiveData";
import { PRODUCER_REGIONS, PRODUCER_RECENT_PARTNERS, PRODUCER_TOP_WHOLESALERS } from "../mocks/industrial-mock-data";
import { ProducerDashboardGrid } from "../shared/ProducerDashboardGrid";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerMetricCard } from "../shared/ProducerMetricCard";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerPartnerTable } from "../widgets/ProducerPartnerTable";

export function ProducerCommercialDashboard() {
  const { data, loading, dataSource, fallbackUsed } = useProducerCommercialNetwork();
  const mapState = useProducerMapControl();

  const regions = data?.regions?.length ? data.regions : PRODUCER_REGIONS;
  const topWholesalers = data?.topWholesalers?.length ? data.topWholesalers : PRODUCER_TOP_WHOLESALERS;
  const recentPartners = data?.recentPartners?.length ? data.recentPartners : PRODUCER_RECENT_PARTNERS;
  const totalOrders = data?.totalOrders7d ?? regions.reduce((s, r) => s + r.orderVolume7d, 0);
  const weakRegions = data?.weakRegions ?? regions.filter((r) => r.growthPct < 8).length;
  const avgGrowth =
    data?.averageGrowthPct ?? regions.reduce((s, r) => s + r.growthPct, 0) / Math.max(regions.length, 1);

  return (
    <section data-testid="producer-dashboard-commercial">
      <ProducerSectionHeader
        kicker="Commercial & Réseau"
        title="Réseau grossistes & couverture terrain"
        subtitle="Performance commerciale, zones actives et pression produits."
      />
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <ProducerDashboardGrid columns={4}>
        <ProducerMetricCard label="Commandes réseau / 7j" value={totalOrders.toLocaleString("fr-FR")} trend="up" />
        <ProducerMetricCard label="Zones actives" value={regions.length} hint="Villes pilotes CI" />
        <ProducerMetricCard label="Régions faibles" value={weakRegions} accent="caution" />
        <ProducerMetricCard label="Croissance moyenne" value={`${avgGrowth.toFixed(1)}%`} trend="up" />
      </ProducerDashboardGrid>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ProducerPartnerTable partners={topWholesalers} title="Top grossistes" testId="commercial-top-wholesalers" />
        <ProducerPartnerTable partners={recentPartners} title="Partenaires récents" testId="commercial-recent-partners" />
      </div>
      <div className="mt-4">
        <IndustrialMapControlSystem
          layer="growth"
          testId="commercial-heatmap"
          data={mapState.data ?? undefined}
          dataSource={mapState.dataSource}
        />
      </div>
    </section>
  );
}
