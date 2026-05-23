"use client";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import { useProducerMapControl, useProducerSupplyLogistics } from "../hooks/useProducerIndustrialLiveData";
import { PRODUCER_SUPPLY_SUMMARY } from "../mocks/industrial-mock-data";
import { ProducerDashboardGrid } from "../shared/ProducerDashboardGrid";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerMetricCard } from "../shared/ProducerMetricCard";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";

export function ProducerSupplyDashboard() {
  const { data, loading, dataSource, fallbackUsed } = useProducerSupplyLogistics();
  const mapState = useProducerMapControl();
  const supply = data ?? PRODUCER_SUPPLY_SUMMARY;

  return (
    <section data-testid="producer-dashboard-supply">
      <ProducerSectionHeader
        kicker="Supply & Logistique"
        title="Flux logistiques & tension distribution"
        subtitle="Corridors, dépendances critiques et activité distribution."
      />
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <ProducerDashboardGrid columns={4}>
        <ProducerMetricCard label="Flux actifs" value={supply.logisticFlowsActive} />
        <ProducerMetricCard label="Zones tension" value={supply.tensionZones} accent="caution" />
        <ProducerMetricCard label="Corridors ralentis" value={supply.slowedCorridors} />
        <ProducerMetricCard label="Pression supply" value={`${supply.supplyPressure}%`} />
        <ProducerMetricCard label="Dépendances critiques" value={supply.criticalDependencies} accent="caution" />
        <ProducerMetricCard label="Activité distribution" value={`${supply.distributionActivity}%`} accent="signal" />
      </ProducerDashboardGrid>
      <div className="mt-4">
        <IndustrialMapControlSystem
          layer="supply"
          testId="supply-operational-map"
          data={mapState.data ?? undefined}
          dataSource={mapState.dataSource}
        />
      </div>
    </section>
  );
}
