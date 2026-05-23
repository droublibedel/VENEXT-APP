import { memo, useCallback, useMemo } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";
import { ProfessionalCommercialNetworkShell } from "professional-commercial-network";
import "professional-commercial-network/styles.css";

import { GrossisteAWorkspaceFrame } from "../../components/GrossisteAWorkspaceFrame";
import { useGrossisteACatalogData } from "../../hooks/useGrossisteACatalogData";
import { useGrossisteAFeatureFlags } from "../../hooks/useGrossisteAFeatureFlags";
import { useGrossisteAFinanceData } from "../../hooks/useGrossisteAFinanceData";
import { useGrossisteANetworkData } from "../../hooks/useGrossisteANetworkData";
import { useGrossisteAOrdersData } from "../../hooks/useGrossisteAOrdersData";
import { useGrossisteATerritoryData } from "../../hooks/useGrossisteATerritoryData";
import { buildGrossisteAProfessionalNetworkInjected } from "./grossiste-a-professional-network-adapter";

export const GrossisteAProfessionalNetworkWorkspace = memo(function GrossisteAProfessionalNetworkWorkspace({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const pcnOn =
    hydrated &&
    enabled &&
    flags.professional_commercial_network_enabled !== false &&
    flags.grossiste_a_partner_network_enabled !== false;

  const network = useGrossisteANetworkData(pcnOn);
  const orders = useGrossisteAOrdersData(pcnOn);
  const catalog = useGrossisteACatalogData(pcnOn);
  const finance = useGrossisteAFinanceData(pcnOn);
  const territory = useGrossisteATerritoryData(pcnOn);

  const refresh = useCallback(() => {
    network.refresh();
    orders.refresh();
    catalog.refresh();
    finance.refresh();
    territory.refresh();
  }, [network, orders, catalog, finance, territory]);

  const injected = useMemo(
    () =>
      buildGrossisteAProfessionalNetworkInjected({
        network: network.data,
        orders: orders.data,
        catalog: catalog.data,
        finance: finance.data,
        territory: territory.data,
        loading:
          network.loading || orders.loading || catalog.loading || finance.loading || territory.loading,
        error: network.error ?? orders.error ?? catalog.error ?? finance.error ?? territory.error,
        dataSource: network.dataSource,
        fallbackUsed:
          network.fallbackUsed ||
          orders.fallbackUsed ||
          catalog.fallbackUsed ||
          finance.fallbackUsed ||
          territory.fallbackUsed,
        onRefresh: refresh,
      }),
    [network, orders, catalog, finance, territory, refresh],
  );

  if (!pcnOn) {
    return (
      <GrossisteAWorkspaceFrame
        title="Réseau Commercial"
        subtitle="Partenaires producteurs — mode formel"
        loading={false}
        dataSource="fallback"
        fallbackUsed
        testId="ga-workspace-network-disabled"
      >
        <p>Réseau commercial professionnel non activé.</p>
      </GrossisteAWorkspaceFrame>
    );
  }

  return (
    <GrossisteAWorkspaceFrame
      title="Réseau Commercial Professionnel"
      subtitle="Producteurs liés — validation explicite, catalogues fermés"
      loading={injected.loading}
      onRefresh={refresh}
      dataSource={injected.dataSource}
      fallbackUsed={injected.fallbackUsed}
      testId="ga-workspace-professional-network"
    >
      <ProfessionalCommercialNetworkShell
        actorRole="grossiste_a"
        enabled={pcnOn}
        injected={injected}
        contextRouting={routingInput}
        flags={{
          professional_commercial_network_enabled: flags.professional_commercial_network_enabled,
          grossiste_a_partner_network_enabled: flags.grossiste_a_partner_network_enabled,
        }}
      />
    </GrossisteAWorkspaceFrame>
  );
});
