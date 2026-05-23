import { memo, useMemo } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { CommerceConversationShell } from "commerce-messaging";
import "commerce-messaging/styles.css";

import { DetaillantScreenHeader } from "../components/DetaillantScreenHeader";
import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { useDetaillantHomeData } from "../hooks/useDetaillantHomeData";
import { useDetaillantNetworkData } from "../hooks/useDetaillantNetworkData";
import { useDetaillantOrdersData } from "../hooks/useDetaillantOrdersData";
import { useDetaillantProductsData } from "../hooks/useDetaillantProductsData";
import { buildDetaillantMessagingInjected } from "./detaillant-messaging-adapter";

export const DetaillantMessagingScreen = memo(function DetaillantMessagingScreen({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const messagingEnabled =
    hydrated && enabled && flags.detaillant_commerce_messaging_enabled !== false;

  const home = useDetaillantHomeData(messagingEnabled);
  const products = useDetaillantProductsData(messagingEnabled);
  const orders = useDetaillantOrdersData(messagingEnabled);
  const network = useDetaillantNetworkData(messagingEnabled);
  const governanceEnabled =
    hydrated && flags.commerce_conversation_governance_enabled !== false;
  const linkedContextEnabled =
    hydrated && flags.commerce_linked_context_enabled !== false;
  const linkedTimelineEnabled =
    hydrated && flags.commerce_linked_timeline_enabled !== false;

  const loading = home.loading || products.loading || orders.loading || network.loading;
  const fallbackUsed =
    home.fallbackUsed || products.fallbackUsed || orders.fallbackUsed || network.fallbackUsed;
  const dataSource =
    home.dataSource === "live" &&
    products.dataSource === "live" &&
    orders.dataSource === "live" &&
    network.dataSource === "live" &&
    !fallbackUsed
      ? "live"
      : fallbackUsed
        ? "fallback"
        : "mixed";

  const refresh = () => {
    home.refresh();
    products.refresh();
    orders.refresh();
    network.refresh();
  };

  const injected = useMemo(
    () =>
      buildDetaillantMessagingInjected({
        home: home.data,
        products: products.data,
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
      home.data,
      products.data,
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
        data-testid="detaillant-screen-messaging-disabled"
        className="detaillant-card"
        style={{ padding: 20 }}
      >
        <p style={{ color: "#8fa39a", margin: 0, fontSize: 14 }}>
          Messagerie — optionnelle, bientôt disponible sur votre compte.
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="detaillant-screen-messaging"
      style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 120px)" }}
    >
      <DetaillantScreenHeader
        title="Messagerie"
        subtitle="Discutez seulement si vous en avez besoin"
        onRefresh={refresh}
        refreshing={loading}
      />
      <p
        style={{ margin: "0 0 12px", fontSize: 12, color: "#8fa39a" }}
        data-testid="detaillant-messaging-optional-note"
      >
        La commande rapide reste disponible dans le catalogue — sans discussion obligatoire.
      </p>
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
        testId="detaillant-commerce-messaging"
      />
    </section>
  );
});
