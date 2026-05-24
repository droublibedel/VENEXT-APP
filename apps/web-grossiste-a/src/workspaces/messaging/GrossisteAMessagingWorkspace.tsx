import { memo, useMemo } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { CommerceConversationShell } from "commerce-messaging";
import "commerce-messaging/styles.css";

import { useGrossisteAFeatureFlags } from "../../hooks/useGrossisteAFeatureFlags";
import { useGrossisteAIntelligenceData } from "../../hooks/useGrossisteAIntelligenceData";
import { useGrossisteANetworkData } from "../../hooks/useGrossisteANetworkData";
import { useGrossisteAOrdersData } from "../../hooks/useGrossisteAOrdersData";
import { useGrossisteACatalogData } from "../../hooks/useGrossisteACatalogData";
import { useGrossisteAOverviewData } from "../../hooks/useGrossisteAOverviewData";
import { buildGrossisteAMessagingInjected } from "./grossiste-a-messaging-adapter";

export const GrossisteAMessagingWorkspace = memo(function GrossisteAMessagingWorkspace({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const messagingEnabled =
    hydrated && enabled && flags.grossiste_a_commerce_messaging_enabled !== false;

  const overview = useGrossisteAOverviewData(messagingEnabled);
  const network = useGrossisteANetworkData(messagingEnabled);
  const orders = useGrossisteAOrdersData(messagingEnabled);
  const intelligence = useGrossisteAIntelligenceData(messagingEnabled);
  const governanceEnabled =
    hydrated && flags.commerce_conversation_governance_enabled !== false;
  const linkedContextEnabled =
    hydrated && flags.commerce_linked_context_enabled !== false;
  const linkedTimelineEnabled =
    hydrated && flags.commerce_linked_timeline_enabled !== false;
  const catalog = useGrossisteACatalogData(messagingEnabled && governanceEnabled);

  const loading =
    overview.loading || network.loading || orders.loading || intelligence.loading;
  const fallbackUsed =
    overview.fallbackUsed ||
    network.fallbackUsed ||
    orders.fallbackUsed ||
    intelligence.fallbackUsed;
  const dataSource =
    overview.dataSource === "live" &&
    network.dataSource === "live" &&
    orders.dataSource === "live" &&
    intelligence.dataSource === "live" &&
    !fallbackUsed
      ? "live"
      : fallbackUsed
        ? "fallback"
        : "mixed";

  const refresh = () => {
    overview.refresh();
    network.refresh();
    orders.refresh();
    intelligence.refresh();
  };

  const injected = useMemo(
    () =>
      buildGrossisteAMessagingInjected({
        overview: overview.data,
        network: network.data,
        orders: orders.data,
        intelligence: intelligence.data,
        governanceEnabled,
        linkedContextEnabled,
        linkedTimelineEnabled,
        dataSource,
        fallbackUsed,
        loading,
        onRefresh: refresh,
      }),
    [
      overview.data,
      network.data,
      orders.data,
      intelligence.data,
      catalog.data,
      governanceEnabled,
      linkedContextEnabled,
      linkedTimelineEnabled,
      dataSource,
      fallbackUsed,
      loading,
    ],
  );

  if (!messagingEnabled) {
    return (
      <section data-testid="ga-workspace-messaging-disabled" className="ga-card" style={{ padding: 24 }}>
        <p style={{ color: "#526059" }}>Messagerie commerciale — bientôt disponible sur votre compte.</p>
      </section>
    );
  }

  return (
    <section data-testid="ga-workspace-messaging" style={{ minHeight: 480 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Messagerie</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#526059" }}>
          Discussions efficaces autour de votre activité commerciale
        </p>
      </header>
      <CommerceConversationShell
        enabled
        liveEnabled={false}
        governanceEnabled={governanceEnabled}
        linkedContextEnabled={linkedContextEnabled}
        linkedTimelineEnabled={linkedTimelineEnabled}
        injected={injected}
        contextRouting={routingInput}
        testId="grossiste-a-commerce-messaging"
      />
    </section>
  );
});
