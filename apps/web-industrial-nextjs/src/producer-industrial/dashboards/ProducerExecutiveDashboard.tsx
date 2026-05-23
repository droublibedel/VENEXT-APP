"use client";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import { useProducerExecutive, useProducerMapControl } from "../hooks/useProducerIndustrialLiveData";
import { ProducerDashboardGrid } from "../shared/ProducerDashboardGrid";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerMetricCard } from "../shared/ProducerMetricCard";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerActivityFeedBridge } from "../activity/ProducerActivityFeedBridge";
import { useIndustrialFeatureFlags } from "../../poles/hooks/useIndustrialFeatureFlags";
import { PRODUCER_EXECUTIVE_SUMMARY } from "../mocks/industrial-mock-data";

export function ProducerExecutiveDashboard() {
  const { data, loading, dataSource, fallbackUsed } = useProducerExecutive();
  const mapState = useProducerMapControl();
  const { flags } = useIndustrialFeatureFlags();
  const executive = data ?? PRODUCER_EXECUTIVE_SUMMARY;
  const feedEnabled = flags.commercial_activity_feed_enabled !== false;

  return (
    <section data-testid="producer-dashboard-executive">
      <ProducerSectionHeader
        kicker="Direction & Stratégie"
        title="Pilotage exécutif réseau"
        subtitle="Vue synthétique — stabilité, corridors et résilience du réseau de distribution."
      />
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <ProducerDashboardGrid testId="executive-metrics">
        <ProducerMetricCard
          label="Stabilité réseau"
          value={`${executive.networkStability}%`}
          hint="Indice composite 7 jours"
          accent="signal"
          testId="metric-network-stability"
        />
        <ProducerMetricCard
          label="Partenaires actifs"
          value={executive.activePartners}
          hint="Grossistes + détaillants"
        />
        <ProducerMetricCard
          label="Corridors critiques"
          value={executive.criticalCorridors}
          hint="Surveillance renforcée"
          accent="caution"
        />
        <ProducerMetricCard
          label="Signaux stratégiques"
          value={executive.strategicSignals}
          hint="Alertes direction"
        />
        <ProducerMetricCard
          label="Activité économique"
          value={executive.economicActivityIndex}
          hint="Indice d'activité réseau"
          trend="up"
        />
        <ProducerMetricCard label="Risques majeurs" value={executive.majorRisks} accent="caution" />
        <ProducerMetricCard label="Santé distribution" value={`${executive.distributionHealth}%`} />
        <ProducerMetricCard
          label="Résilience réseau"
          value={`${executive.networkResilience}%`}
          accent="signal"
        />
      </ProducerDashboardGrid>
      {feedEnabled ? (
        <div className="mt-6" data-testid="producer-activity-feed">
          <ProducerActivityFeedBridge />
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <IndustrialMapControlSystem
          layer="tension"
          testId="executive-map-tension"
          data={mapState.data ?? undefined}
          dataSource={mapState.dataSource}
        />
        <IndustrialMapControlSystem
          layer="activity"
          compact
          testId="executive-map-activity"
          data={mapState.data ?? undefined}
          dataSource={mapState.dataSource}
        />
      </div>
    </section>
  );
}
