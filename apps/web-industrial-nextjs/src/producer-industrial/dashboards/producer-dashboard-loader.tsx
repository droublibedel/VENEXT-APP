"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { ProducerPoleId } from "../navigation/producer-navigation.config";

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-2" data-testid="producer-dashboard-skeleton">
      <div className="h-8 w-48 rounded bg-slate-800/80" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded border border-slate-800 bg-slate-900/50" />
        ))}
      </div>
    </div>
  );
}

const Executive = dynamic(() => import("./ProducerExecutiveDashboard").then((m) => m.ProducerExecutiveDashboard), {
  loading: () => <DashboardSkeleton />,
});
const Commercial = dynamic(() => import("./ProducerCommercialDashboard").then((m) => m.ProducerCommercialDashboard), {
  loading: () => <DashboardSkeleton />,
});
const RelationalCommercial = dynamic(
  () =>
    import("../relational-commercial-workspace/RelationalCommercialWorkspace").then(
      (m) => m.RelationalCommercialWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const ProfessionalNetwork = dynamic(
  () =>
    import("../producer-professional-network-workspace/ProducerProfessionalNetworkWorkspace").then(
      (m) => m.ProducerProfessionalNetworkWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const OrderFulfillment = dynamic(
  () =>
    import("../order-fulfillment-workspace/ProducerOrderFulfillmentWorkspace").then(
      (m) => m.ProducerOrderFulfillmentWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const CommercialMail = dynamic(
  () =>
    import("../producer-commercial-mail-workspace/ProducerCommercialMailWorkspace").then(
      (m) => m.ProducerCommercialMailWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const CatalogProducts = dynamic(
  () => import("../catalog-product-workspace/ProducerCatalogWorkspace").then((m) => m.ProducerCatalogWorkspace),
  { loading: () => <DashboardSkeleton /> },
);
const TerritoryDistribution = dynamic(
  () =>
    import("../territory-distribution-workspace/ProducerTerritoryDistributionWorkspace").then(
      (m) => m.ProducerTerritoryDistributionWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const MarketingActivation = dynamic(
  () =>
    import("../marketing-activation-workspace/ProducerMarketingActivationWorkspace").then(
      (m) => m.ProducerMarketingActivationWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const SupplyLogistics = dynamic(
  () =>
    import("../supply-logistics-workspace/ProducerSupplyLogisticsWorkspace").then(
      (m) => m.ProducerSupplyLogisticsWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const FinanceCollections = dynamic(
  () =>
    import("../finance-collections-workspace/ProducerFinanceCollectionsWorkspace").then(
      (m) => m.ProducerFinanceCollectionsWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);
const DataIntelligence = dynamic(
  () =>
    import("../data-intelligence-workspace/ProducerDataIntelligenceWorkspace").then(
      (m) => m.ProducerDataIntelligenceWorkspace,
    ),
  { loading: () => <DashboardSkeleton /> },
);

const DASHBOARDS: Record<ProducerPoleId, ComponentType> = {
  executive: Executive,
  commercial: Commercial,
  "relational-commercial": RelationalCommercial,
  "professional-commercial-network-workspace": ProfessionalNetwork,
  "order-fulfillment": OrderFulfillment,
  "producer-commercial-mail-workspace": CommercialMail,
  "catalog-products": CatalogProducts,
  "territory-distribution": TerritoryDistribution,
  "marketing-activation-workspace": MarketingActivation,
  "supply-logistics-workspace": SupplyLogistics,
  "finance-collections-workspace": FinanceCollections,
  "data-intelligence-workspace": DataIntelligence,
};

export function ProducerDashboardByPole(props: { pole: ProducerPoleId }) {
  const Dashboard = DASHBOARDS[props.pole];
  return <Dashboard />;
}
