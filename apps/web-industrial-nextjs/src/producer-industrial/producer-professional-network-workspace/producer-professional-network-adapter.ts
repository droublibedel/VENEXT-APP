import type { ProfessionalNetworkInjected, ProfessionalNetworkView } from "professional-commercial-network";
import { buildProfessionalNetworkView } from "professional-commercial-network";

import type {
  ProducerCommercialNetworkDto,
  ProducerFinanceCollectionsDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerPartnerDto,
} from "../data/producer-industrial-data.types";

export function buildProducerProfessionalNetworkView(input: {
  commercial: ProducerCommercialNetworkDto | null;
  partners: ProducerPartnerDto[] | null;
  orders: ProducerOrderSummaryDto | null;
  finance: ProducerFinanceCollectionsDto | null;
  network: ProducerNetworkActivityDto | null;
}): ProfessionalNetworkView {
  const base = buildProfessionalNetworkView("producteur");
  const wholesalers = input.commercial?.topWholesalers ?? [];

  const merged = base.partners.map((p, i) => {
    const w = wholesalers[i];
    if (!w) return p;
    return {
      ...p,
      companyName: w.name,
      city: input.commercial?.regions?.find((r) => r.id === w.regionId)?.name ?? p.city,
      stabilityLabel: w.risk === "elevated" ? "Sous surveillance" : "Stable",
      lastActivity: `${w.orders7d} commandes / 7j`,
    };
  });

  return {
    ...base,
    partners: merged,
    activitySummary:
      input.network != null
        ? `Réseau actif — ${input.network.activePartners} partenaires structurés`
        : base.activitySummary,
  };
}

export function buildProducerProfessionalNetworkInjected(input: {
  commercial: ProducerCommercialNetworkDto | null;
  partners: ProducerPartnerDto[] | null;
  orders: ProducerOrderSummaryDto | null;
  finance: ProducerFinanceCollectionsDto | null;
  network: ProducerNetworkActivityDto | null;
  loading: boolean;
  error: string | null;
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  onRefresh: () => void;
}): ProfessionalNetworkInjected {
  return {
    view: buildProducerProfessionalNetworkView({
      commercial: input.commercial,
      partners: input.partners,
      orders: input.orders,
      finance: input.finance,
      network: input.network,
    }),
    dataSource: input.dataSource,
    fallbackUsed: input.fallbackUsed,
    loading: input.loading,
    error: input.error,
    onRefresh: input.onRefresh,
  };
}
