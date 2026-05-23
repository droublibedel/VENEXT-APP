import { memo, useCallback } from "react";
import { CommercialNetworkDiscoveryShell } from "commercial-network-discovery";
import "commercial-network-discovery/styles.css";

import { useGrossisteCatalogData } from "../hooks/useGrossisteCatalogData";
import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { useGrossisteNetworkData } from "../hooks/useGrossisteNetworkData";
import { useGrossisteOrdersData } from "../hooks/useGrossisteOrdersData";
import { buildGrossisteBDiscoveryInjected } from "./grossiste-b-discovery-adapter";

export const GrossisteBNetworkDiscovery = memo(function GrossisteBNetworkDiscovery({
  enabled,
  onQuickOrder,
  onMessage,
}: {
  enabled: boolean;
  onQuickOrder?: (partnerId: string) => void;
  onMessage?: (partnerId: string) => void;
}) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const discoveryOn =
    hydrated && enabled && flags.commercial_network_discovery_enabled !== false;

  const network = useGrossisteNetworkData(discoveryOn);
  const catalog = useGrossisteCatalogData(discoveryOn);
  const orders = useGrossisteOrdersData(discoveryOn);

  const refresh = useCallback(() => {
    network.refresh();
    catalog.refresh();
    orders.refresh();
  }, [network, catalog, orders]);

  const injected = buildGrossisteBDiscoveryInjected({
    network: network.data,
    catalog: catalog.data,
    orders: orders.data,
    loading: network.loading || catalog.loading || orders.loading,
    error: network.error ?? catalog.error ?? orders.error,
    dataSource: network.dataSource,
    fallbackUsed: network.fallbackUsed || catalog.fallbackUsed || orders.fallbackUsed,
    onRefresh: refresh,
    onQuickOrder,
    onMessage,
  });

  return (
    <CommercialNetworkDiscoveryShell
      actorRole="grossiste_b"
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
