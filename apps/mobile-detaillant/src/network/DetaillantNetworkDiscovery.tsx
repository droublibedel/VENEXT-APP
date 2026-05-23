import { memo, useCallback } from "react";
import { CommercialNetworkDiscoveryShell } from "commercial-network-discovery";
import "commercial-network-discovery/styles.css";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { useDetaillantNetworkData } from "../hooks/useDetaillantNetworkData";
import { useDetaillantOrdersData } from "../hooks/useDetaillantOrdersData";
import { useDetaillantProductsData } from "../hooks/useDetaillantProductsData";
import { buildDetaillantDiscoveryInjected } from "./detaillant-discovery-adapter";

export const DetaillantNetworkDiscovery = memo(function DetaillantNetworkDiscovery({
  enabled,
  onQuickOrder,
  onMessage,
}: {
  enabled: boolean;
  onQuickOrder?: (partnerId: string) => void;
  onMessage?: (partnerId: string) => void;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const discoveryOn =
    hydrated && enabled && flags.commercial_network_discovery_enabled !== false;

  const network = useDetaillantNetworkData(discoveryOn);
  const products = useDetaillantProductsData(discoveryOn);
  const orders = useDetaillantOrdersData(discoveryOn);

  const refresh = useCallback(() => {
    network.refresh();
    products.refresh();
    orders.refresh();
  }, [network, products, orders]);

  const injected = buildDetaillantDiscoveryInjected({
    network: network.data,
    products: products.data,
    orders: orders.data,
    loading: network.loading || products.loading || orders.loading,
    error: network.error ?? products.error ?? orders.error,
    dataSource: network.dataSource,
    fallbackUsed: network.fallbackUsed || products.fallbackUsed || orders.fallbackUsed,
    onRefresh: refresh,
    onQuickOrder,
    onMessage,
  });

  return (
    <CommercialNetworkDiscoveryShell
      actorRole="detaillant"
      enabled={discoveryOn}
      injected={injected}
      flags={{
        commercial_network_discovery_enabled: flags.commercial_network_discovery_enabled,
        commercial_auto_accept_enabled: flags.commercial_auto_accept_enabled,
        commercial_contact_first_identity_enabled: flags.commercial_contact_first_identity_enabled,
        commercial_activity_based_suggestions_enabled: flags.commercial_activity_based_suggestions_enabled,
      }}
    />
  );
});
