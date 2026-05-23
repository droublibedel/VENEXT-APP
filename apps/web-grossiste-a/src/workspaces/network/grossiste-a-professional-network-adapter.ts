import type { ProfessionalNetworkInjected, ProfessionalNetworkView } from "professional-commercial-network";
import { buildProfessionalNetworkView } from "professional-commercial-network";

import type {
  GrossisteACatalogDto,
  GrossisteAFinanceDto,
  GrossisteANetworkDto,
  GrossisteAOrdersDto,
  GrossisteATerritoryDto,
} from "../../hooks/grossiste-a-data.types";

export function buildGrossisteAProfessionalNetworkView(input: {
  network: GrossisteANetworkDto | null;
  orders: GrossisteAOrdersDto | null;
  catalog: GrossisteACatalogDto | null;
  finance: GrossisteAFinanceDto | null;
  territory: GrossisteATerritoryDto | null;
}): ProfessionalNetworkView {
  const base = buildProfessionalNetworkView("grossiste_a");
  const producers = input.network?.activePartners ?? [];

  const merged = base.partners.map((p, i) => {
    const partner = producers[i];
    if (!partner) return p;
    return {
      ...p,
      companyName: partner.name,
      city: partner.city,
      activityType: partner.type,
      lastActivity: `${partner.orders7d} commandes / 7j`,
    };
  });

  return {
    ...base,
    partners: merged,
    territory: {
      cities: input.territory?.cityActivity.map((c) => c.city) ?? base.territory.cities,
      corridors: input.territory?.corridorActivity.map((c) => c.label) ?? base.territory.corridors,
      activeZones: input.territory?.growthZones ?? base.territory.activeZones,
      stabilityNote: input.network?.networkActivity ?? base.territory.stabilityNote,
    },
  };
}

export function buildGrossisteAProfessionalNetworkInjected(input: {
  network: GrossisteANetworkDto | null;
  orders: GrossisteAOrdersDto | null;
  catalog: GrossisteACatalogDto | null;
  finance: GrossisteAFinanceDto | null;
  territory: GrossisteATerritoryDto | null;
  loading: boolean;
  error: string | null;
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  onRefresh: () => void;
}): ProfessionalNetworkInjected {
  return {
    view: buildGrossisteAProfessionalNetworkView({
      network: input.network,
      orders: input.orders,
      catalog: input.catalog,
      finance: input.finance,
      territory: input.territory,
    }),
    dataSource: input.dataSource,
    fallbackUsed: input.fallbackUsed,
    loading: input.loading,
    error: input.error,
    onRefresh: input.onRefresh,
  };
}
