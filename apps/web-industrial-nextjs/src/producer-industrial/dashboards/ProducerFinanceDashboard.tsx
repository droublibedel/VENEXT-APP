"use client";

import { formatXof } from "../mocks/industrial-mock-data";
import { useProducerFinanceCollections } from "../hooks/useProducerIndustrialLiveData";
import { PRODUCER_FINANCE_SUMMARY, PRODUCER_TOP_WHOLESALERS } from "../mocks/industrial-mock-data";
import { ProducerDashboardGrid } from "../shared/ProducerDashboardGrid";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerMetricCard } from "../shared/ProducerMetricCard";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";
import { ProducerPartnerTable } from "../widgets/ProducerPartnerTable";

export function ProducerFinanceDashboard() {
  const { data, loading, dataSource, fallbackUsed } = useProducerFinanceCollections();
  const finance = data ?? {
    ...PRODUCER_FINANCE_SUMMARY,
    atRiskPartnerList: PRODUCER_TOP_WHOLESALERS.filter((p) => p.risk !== "stable"),
  };
  const atRisk =
    finance.atRiskPartnerList?.length > 0
      ? finance.atRiskPartnerList
      : PRODUCER_TOP_WHOLESALERS.filter((p) => p.risk !== "stable");

  return (
    <section data-testid="producer-dashboard-finance">
      <ProducerSectionHeader
        kicker="Finance & Encaissements"
        title="Stabilité financière du réseau"
        subtitle="Encaissements, retards et exposition économique."
      />
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <ProducerDashboardGrid columns={3}>
        <ProducerMetricCard
          label="Stabilité financière"
          value={`${finance.networkFinancialStability}%`}
          accent="signal"
        />
        <ProducerMetricCard
          label="Encaissements / 7j"
          value={formatXof(finance.collections7dXof)}
          trend="up"
        />
        <ProducerMetricCard label="Partenaires à risque" value={finance.atRiskPartners} accent="caution" />
        <ProducerMetricCard label="Retards moyens" value={`${finance.paymentDelaysDays} j`} accent="caution" />
        <ProducerMetricCard label="Exposition" value={formatXof(finance.economicExposureXof)} />
        <ProducerMetricCard label="Pression paiements" value={`${finance.paymentPressure}%`} />
      </ProducerDashboardGrid>
      <div className="mt-4">
        <ProducerPartnerTable partners={atRisk} title="Partenaires sous surveillance" testId="finance-at-risk" />
      </div>
    </section>
  );
}
