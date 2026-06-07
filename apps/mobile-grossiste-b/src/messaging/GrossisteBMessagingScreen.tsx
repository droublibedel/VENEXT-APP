import { memo, useMemo } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { CommerceConversationShell } from "commerce-messaging";
import "commerce-messaging/styles.css";

import { useGrossisteActivityData } from "../hooks/useGrossisteActivityData";
import { useGrossisteCatalogData } from "../hooks/useGrossisteCatalogData";
import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { useGrossisteNetworkData } from "../hooks/useGrossisteNetworkData";
import { useGrossisteOrdersData } from "../hooks/useGrossisteOrdersData";
import { GrossisteScreenHeader } from "../components/GrossisteScreenHeader";
import { buildGrossisteBMessagingInjected } from "./grossiste-b-messaging-adapter";

export const GrossisteBMessagingScreen = memo(function GrossisteBMessagingScreen({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const messagingEnabled =
    hydrated && enabled && flags.grossiste_b_commerce_messaging_enabled !== false;

  const activity = useGrossisteActivityData(messagingEnabled);
  const catalog = useGrossisteCatalogData(messagingEnabled);
  const orders = useGrossisteOrdersData(messagingEnabled);
  const network = useGrossisteNetworkData(messagingEnabled);
  const governanceEnabled =
    hydrated && flags.commerce_conversation_governance_enabled !== false;
  const linkedContextEnabled =
    hydrated && flags.commerce_linked_context_enabled !== false;
  const linkedTimelineEnabled =
    hydrated && flags.commerce_linked_timeline_enabled !== false;

  const loading =
    activity.loading || catalog.loading || orders.loading || network.loading;
  const fallbackUsed =
    activity.fallbackUsed ||
    catalog.fallbackUsed ||
    orders.fallbackUsed ||
    network.fallbackUsed;
  const dataSource =
    activity.dataSource === "live" &&
    catalog.dataSource === "live" &&
    orders.dataSource === "live" &&
    network.dataSource === "live" &&
    !fallbackUsed
      ? "live"
      : fallbackUsed
        ? "fallback"
        : "mixed";

  const refresh = () => {
    activity.refresh();
    catalog.refresh();
    orders.refresh();
    network.refresh();
  };

  const injected = useMemo(
    () =>
      buildGrossisteBMessagingInjected({
        activity: activity.data,
        catalog: catalog.data,
        orders: orders.data,
        network: network.data,
        governanceEnabled,
        linkedContextEnabled,
        linkedTimelineEnabled,
        dataSource,
        fallbackUsed,
        loading,
        onRefresh: refresh,
      }),
    [
      activity.data,
      catalog.data,
      orders.data,
      network.data,
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
      <section
        data-testid="grossiste-screen-messaging-disabled"
        className="grossiste-b-card"
        style={{ padding: 20 }}
      >
        <p style={{ color: "var(--venext-text-muted)", margin: 0, fontSize: 14 }}>
          Messagerie commerciale — bientôt disponible sur votre compte.
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="grossiste-screen-messaging"
      style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 120px)" }}
    >
      <GrossisteScreenHeader
        title="Messagerie"
        subtitle="Échanges rapides autour de vos ventes"
        onRefresh={refresh}
        refreshing={loading}
      />
      <CommerceConversationShell
        enabled
        liveEnabled
        terrainMessaging
        layout="mobile"
        governanceEnabled={governanceEnabled}
        linkedContextEnabled={linkedContextEnabled}
        linkedTimelineEnabled={linkedTimelineEnabled}
        injected={injected}
        contextRouting={routingInput}
        testId="grossiste-b-commerce-messaging"
      />
    </section>
  );
});
