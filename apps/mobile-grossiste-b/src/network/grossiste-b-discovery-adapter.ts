import type { CommercialDiscoveryInjected, CommercialDiscoveryView } from "commercial-network-discovery";
import { applyTerrainIdentityToView, mockCommercialDiscoveryView } from "commercial-network-discovery";

import type {
  GrossisteCatalogDto,
  GrossisteNetworkDto,
  GrossisteOrdersDto,
} from "../hooks/grossiste-b-data.types";

const IDENTITY_FLAGS = {
  commercial_contact_first_identity_enabled: true,
  commercial_activity_based_suggestions_enabled: true,
} as const;

export function buildGrossisteBDiscoveryView(input: {
  network: GrossisteNetworkDto | null;
  catalog: GrossisteCatalogDto | null;
  orders: GrossisteOrdersDto | null;
}): CommercialDiscoveryView {
  const base = mockCommercialDiscoveryView("grossiste_b");
  const partners = [
    ...(input.network?.recentPartners ?? []),
    ...(input.network?.activePartners ?? []),
  ];

  const boosted = base.suggestions.map((s, i) => {
    const p = partners[i];
    if (!p) return s;
    const allOrders = [...(input.orders?.received ?? []), ...(input.orders?.sent ?? [])];
    const hasOrders = allOrders.some((o) => o.partner === p.name);
    const activity =
      "type" in p
        ? `${p.type} · ${p.lastActive ?? "actif"}`
        : `${p.orders7d} commandes / 7j`;
    return {
      ...s,
      registeredBusinessName: p.name,
      activityLabel: activity,
      city: p.city,
      hasOrders,
      matchKind: hasOrders ? ("activity_boosted" as const) : s.matchKind,
    };
  });

  return applyTerrainIdentityToView(
    { ...base, suggestions: boosted },
    "grossiste_b",
    IDENTITY_FLAGS,
  );
}

export function buildGrossisteBDiscoveryInjected(input: {
  network: GrossisteNetworkDto | null;
  catalog: GrossisteCatalogDto | null;
  orders: GrossisteOrdersDto | null;
  loading: boolean;
  error: string | null;
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  onRefresh: () => void;
  onConnect?: (id: string) => void;
  onQuickOrder?: (partnerId: string) => void;
  onMessage?: (partnerId: string) => void;
}): CommercialDiscoveryInjected {
  return {
    view: buildGrossisteBDiscoveryView({
      network: input.network,
      catalog: input.catalog,
      orders: input.orders,
    }),
    dataSource: input.dataSource,
    fallbackUsed: input.fallbackUsed,
    loading: input.loading,
    error: input.error,
    onRefresh: input.onRefresh,
    onConnect: input.onConnect,
    onQuickOrder: input.onQuickOrder,
    onMessage: input.onMessage,
  };
}
