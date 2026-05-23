import type { CommercialDiscoveryInjected, CommercialDiscoveryView } from "commercial-network-discovery";
import { applyTerrainIdentityToView, mockCommercialDiscoveryView } from "commercial-network-discovery";

import type {
  DetaillantNetworkDto,
  DetaillantOrdersDto,
  DetaillantProductsDto,
} from "../hooks/detaillant-data.types";

const IDENTITY_FLAGS = {
  commercial_contact_first_identity_enabled: true,
  commercial_activity_based_suggestions_enabled: true,
} as const;

export function buildDetaillantDiscoveryView(input: {
  network: DetaillantNetworkDto | null;
  products: DetaillantProductsDto | null;
  orders: DetaillantOrdersDto | null;
}): CommercialDiscoveryView {
  const base = mockCommercialDiscoveryView("detaillant");
  const suppliers = input.network?.activeSuppliers ?? [];

  const boosted = base.suggestions.map((s, i) => {
    const sup = suppliers[i];
    if (!sup) return s;
    return {
      ...s,
      registeredBusinessName: sup.name,
      activityLabel: sup.type,
      city: sup.city,
      matchKind: "mutual" as const,
    };
  });

  return applyTerrainIdentityToView(
    { ...base, suggestions: boosted },
    "detaillant",
    IDENTITY_FLAGS,
  );
}

export function buildDetaillantDiscoveryInjected(input: {
  network: DetaillantNetworkDto | null;
  products: DetaillantProductsDto | null;
  orders: DetaillantOrdersDto | null;
  loading: boolean;
  error: string | null;
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  onRefresh: () => void;
  onQuickOrder?: (partnerId: string) => void;
  onMessage?: (partnerId: string) => void;
}): CommercialDiscoveryInjected {
  return {
    view: buildDetaillantDiscoveryView({
      network: input.network,
      products: input.products,
      orders: input.orders,
    }),
    dataSource: input.dataSource,
    fallbackUsed: input.fallbackUsed,
    loading: input.loading,
    error: input.error,
    onRefresh: input.onRefresh,
    onQuickOrder: input.onQuickOrder,
    onMessage: input.onMessage,
  };
}
