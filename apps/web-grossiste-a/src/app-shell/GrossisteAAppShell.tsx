import { lazy, Suspense, useState } from "react";

import { CommercialRouterProvider } from "commercial-context-routing";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { GrossisteASidebar } from "../navigation/GrossisteASidebar";
import type { GrossisteAWorkspaceId } from "../navigation/grossiste-a-navigation.config";
import { useGrossisteACommercialRouter } from "../routing/useGrossisteACommercialRouter";
import { GrossisteANotificationsBridge } from "../notifications/GrossisteANotificationsBridge";
import { GrossisteAOfflineBridge } from "../offline/GrossisteAOfflineBridge";
import { GrossisteASeparationBridge } from "../governance/GrossisteASeparationBridge";
import { GrossisteAHumanizedErrorsBridge } from "../errors/GrossisteAHumanizedErrorsBridge";
import { GrossisteALiveObservabilityBridge } from "../observability/GrossisteALiveObservabilityBridge";
import { GrossisteAPerformanceBridge } from "../performance/GrossisteAPerformanceBridge";
import { GrossisteAUxHarmonyBridge } from "../ux/GrossisteAUxHarmonyBridge";
import { VenextWorkspaceLoader } from "../ux/VenextWorkspaceLoader";

const Overview = lazy(() =>
  import("../workspaces/GrossisteAOverviewWorkspace").then((m) => ({ default: m.GrossisteAOverviewWorkspace })),
);
const Network = lazy(() =>
  import("../workspaces/GrossisteANetworkWorkspace").then((m) => ({ default: m.GrossisteANetworkWorkspace })),
);
const Messaging = lazy(() =>
  import("../workspaces/messaging/GrossisteAMessagingWorkspace").then((m) => ({
    default: m.GrossisteAMessagingWorkspace,
  })),
);
const Wallet = lazy(() =>
  import("../workspaces/wallet/GrossisteAWalletWorkspace").then((m) => ({
    default: m.GrossisteAWalletWorkspace,
  })),
);
const Orders = lazy(() =>
  import("../workspaces/GrossisteAOrdersWorkspace").then((m) => ({ default: m.GrossisteAOrdersWorkspace })),
);
const Distribution = lazy(() =>
  import("../workspaces/GrossisteADistributionWorkspace").then((m) => ({
    default: m.GrossisteADistributionWorkspace,
  })),
);
const Catalog = lazy(() =>
  import("../workspaces/GrossisteACatalogWorkspace").then((m) => ({ default: m.GrossisteACatalogWorkspace })),
);
const Territory = lazy(() =>
  import("../workspaces/GrossisteATerritoryWorkspace").then((m) => ({ default: m.GrossisteATerritoryWorkspace })),
);
const Finance = lazy(() =>
  import("../workspaces/GrossisteAFinanceWorkspace").then((m) => ({ default: m.GrossisteAFinanceWorkspace })),
);
const Intelligence = lazy(() =>
  import("../workspaces/GrossisteAIntelligenceWorkspace").then((m) => ({
    default: m.GrossisteAIntelligenceWorkspace,
  })),
);
const Governance = lazy(() =>
  import("../workspaces/GrossisteAGovernanceWorkspace").then((m) => ({
    default: m.GrossisteAGovernanceWorkspace,
  })),
);

function WorkspaceLoader({ variant }: { variant?: "dashboard" | "wallet" | "messaging" | "catalog" | "orders" | "pole" }) {
  return <VenextWorkspaceLoader variant={variant ?? "dashboard"} />;
}

function GrossisteAQuickReturnBar({
  canGoBack,
  goBack,
}: {
  canGoBack: boolean;
  goBack: () => void;
}) {
  if (!canGoBack) return null;
  return (
    <button
      type="button"
      data-testid="grossiste-a-commercial-quick-return"
      onClick={goBack}
      style={{
        margin: "12px 0",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #2a3530",
        background: "#121816",
        color: "#b8c9c0",
        fontSize: 13,
      }}
    >
      ← Retour au flux précédent
    </button>
  );
}

export function GrossisteAAppShell() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const enabled = hydrated && flags.grossiste_a_web_enabled !== false;
  const [active, setActive] = useState<GrossisteAWorkspaceId>("overview");
  const { router, routingInput, focusReference, canGoBack, goBack } =
    useGrossisteACommercialRouter(setActive);

  if (!enabled) {
    return (
      <div className="ga-shell" data-testid="grossiste-a-disabled">
        <main className="ga-main">
          <p>Espace Grossiste A — bientôt disponible sur votre compte.</p>
        </main>
      </div>
    );
  }

  return (
    <CommercialRouterProvider router={router} flags={routingInput.flags}>
      <div className="ga-shell" data-testid="grossiste-a-app">
        <GrossisteANotificationsBridge />
        <GrossisteAUxHarmonyBridge />
        <GrossisteAHumanizedErrorsBridge />
        <GrossisteALiveObservabilityBridge />
        <GrossisteASeparationBridge activeWorkspace={active} />
        <GrossisteAPerformanceBridge />
        <GrossisteAOfflineBridge />
        <GrossisteASidebar active={active} onSelect={setActive} />
        <main className="ga-main" data-testid={`ga-main-${active}`}>
          <GrossisteAQuickReturnBar canGoBack={canGoBack} goBack={goBack} />
          <Suspense fallback={<WorkspaceLoader />}>
            {active === "overview" ? <Overview enabled /> : null}
            {active === "network" ? <Network enabled routingInput={routingInput} /> : null}
            {active === "commerce-messaging" ? <Messaging enabled routingInput={routingInput} /> : null}
            {active === "commerce-wallet" ? <Wallet enabled routingInput={routingInput} /> : null}
            {active === "orders" ? (
              <Orders enabled routingInput={routingInput} focusReference={focusReference} />
            ) : null}
            {active === "distribution" ? <Distribution enabled routingInput={routingInput} /> : null}
            {active === "catalog" ? <Catalog enabled routingInput={routingInput} /> : null}
            {active === "territory" ? <Territory enabled routingInput={routingInput} /> : null}
            {active === "finance" ? <Finance enabled /> : null}
            {active === "intelligence" ? <Intelligence enabled /> : null}
            {active === "governance" ? (
              <Governance enabled onNavigateWorkspace={(ws) => setActive(ws as GrossisteAWorkspaceId)} />
            ) : null}
          </Suspense>
        </main>
      </div>
    </CommercialRouterProvider>
  );
}
