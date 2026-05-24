import { lazy, Suspense, useCallback, useState } from "react";

import { CommercialRouterProvider } from "commercial-context-routing";

import { GrossisteBBottomTabs } from "../navigation/GrossisteBBottomTabs";
import { GrossisteBTerrainHeader } from "../navigation/GrossisteBTerrainHeader";
import type { GrossisteBTabId } from "../navigation/grossiste-b-navigation.config";
import { useGrossisteBCommercialRouter } from "../routing/useGrossisteBCommercialRouter";
import { GrossisteActivityScreen } from "../screens/GrossisteActivityScreen";
import { GrossisteCatalogScreen } from "../screens/GrossisteCatalogScreen";
import { GrossisteNetworkScreen } from "../screens/GrossisteNetworkScreen";
import { GrossisteOrdersScreen } from "../screens/GrossisteOrdersScreen";
import { GrossisteProfileScreen } from "../screens/GrossisteProfileScreen";
import { useVenextAuthOptional } from "venext-auth-foundation";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { GrossisteBOfflineBridge } from "../offline/GrossisteBOfflineBridge";
import { GrossisteBHumanizedErrorsBridge } from "../errors/GrossisteBHumanizedErrorsBridge";
import { GrossisteBLiveObservabilityBridge } from "../observability/GrossisteBLiveObservabilityBridge";
import { GrossisteBPerformanceBridge } from "../performance/GrossisteBPerformanceBridge";
import { GrossisteBLocationBridge } from "../location/GrossisteBLocationBridge";
import { GrossisteBUxHarmonyBridge } from "../ux/GrossisteBUxHarmonyBridge";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";
import {
  isGrossisteBOnboardingComplete,
  loadGrossisteBOnboardingProfile,
} from "../onboarding/grossiste-b-onboarding.viewmodel";

const GrossisteBMessagingScreen = lazy(() =>
  import("../messaging/GrossisteBMessagingScreen").then((m) => ({
    default: m.GrossisteBMessagingScreen,
  })),
);
const GrossisteBWalletScreen = lazy(() =>
  import("../wallet/GrossisteBWalletScreen").then((m) => ({
    default: m.GrossisteBWalletScreen,
  })),
);
const GrossisteBQuickOnboarding = lazy(() =>
  import("../onboarding/GrossisteBQuickOnboarding").then((m) => ({
    default: m.GrossisteBQuickOnboarding,
  })),
);

function ScreenLoader({ variant }: { variant?: "wallet" | "messaging" | "dashboard" }) {
  return <VenextScreenLoader variant={variant ?? "dashboard"} />;
}

function GrossisteBQuickReturnBar({
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
      className="grossiste-b-quick-return"
      data-testid="grossiste-commercial-quick-return"
      onClick={goBack}
      style={{
        margin: "8px 12px",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid var(--venext-border)",
        background: "var(--venext-surface)",
        color: "var(--venext-text-secondary)",
        fontSize: 13,
        width: "calc(100% - 24px)",
      }}
    >
      ← Retour au flux précédent
    </button>
  );
}

function GrossisteBAppContent({
  activeTab,
  enabled,
  routingInput,
  focusReference,
  canGoBack,
  goBack,
  onOpenWallet,
}: {
  activeTab: GrossisteBTabId;
  enabled: boolean;
  routingInput: ReturnType<typeof useGrossisteBCommercialRouter>["routingInput"];
  focusReference: ReturnType<typeof useGrossisteBCommercialRouter>["focusReference"];
  canGoBack: boolean;
  goBack: () => void;
  onOpenWallet: () => void;
}) {
  return (
    <>
      <GrossisteBQuickReturnBar canGoBack={canGoBack} goBack={goBack} />
      <GrossisteBLocationBridge />
      <GrossisteBUxHarmonyBridge />
      <GrossisteBHumanizedErrorsBridge />
      <GrossisteBLiveObservabilityBridge />
      <GrossisteBPerformanceBridge />
      <GrossisteBOfflineBridge />
      <main className="grossiste-b-main" data-testid={`grossiste-main-${activeTab}`}>
        {activeTab === "activity" ? (
          <GrossisteActivityScreen enabled routingInput={routingInput} />
        ) : null}
        {activeTab === "messaging" ? (
          <Suspense fallback={<ScreenLoader variant="messaging" />}>
            <GrossisteBMessagingScreen enabled routingInput={routingInput} />
          </Suspense>
        ) : null}
        {activeTab === "wallet" ? (
          <Suspense fallback={<ScreenLoader variant="wallet" />}>
            <GrossisteBWalletScreen enabled routingInput={routingInput} />
          </Suspense>
        ) : null}
        {activeTab === "catalog" ? (
          <GrossisteCatalogScreen enabled routingInput={routingInput} />
        ) : null}
        {activeTab === "orders" ? (
          <GrossisteOrdersScreen enabled routingInput={routingInput} focusReference={focusReference} />
        ) : null}
        {activeTab === "network" ? <GrossisteNetworkScreen enabled /> : null}
        {activeTab === "profile" ? (
          <GrossisteProfileScreen enabled onOpenWallet={onOpenWallet} />
        ) : null}
      </main>
    </>
  );
}

export function GrossisteBAppShell() {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const auth = useVenextAuthOptional();
  const authFoundation = hydrated && flags.venext_auth_foundation_enabled !== false;
  const enabled = hydrated && flags.grossiste_b_mobile_enabled !== false;
  const needsQuickOnboarding = hydrated && flags.terrain_quick_onboarding_enabled !== false;
  const terrainSessionReady =
    !authFoundation || (auth?.isAuthenticated ?? false) || isGrossisteBOnboardingComplete();
  const [activeTab, setActiveTab] = useState<GrossisteBTabId>("activity");
  const [onboardingDone, setOnboardingDone] = useState(() => isGrossisteBOnboardingComplete());
  const handleOnboardingComplete = useCallback(() => {
    setOnboardingDone(true);
    if (authFoundation && auth) {
      const legacy = loadGrossisteBOnboardingProfile();
      if (legacy?.phone && legacy.displayName) {
        auth.establishTerrainSession({
          phone: legacy.phone,
          displayName: legacy.displayName,
          businessName: legacy.businessName,
          activities: legacy.activities ?? [],
          city: legacy.city,
          otpVerified: true,
        });
      }
    }
  }, [auth, authFoundation]);

  const { router, routingInput, focusReference, canGoBack, goBack } =
    useGrossisteBCommercialRouter(setActiveTab);

  if (!enabled) {
    return (
      <div className="grossiste-b-app" data-testid="grossiste-mobile-disabled">
        <main className="grossiste-b-main">
          <p style={{ padding: 24, color: "var(--venext-text-muted)", fontSize: 14 }}>
            Application grossiste B — bientôt disponible sur votre compte.
          </p>
        </main>
      </div>
    );
  }

  if (needsQuickOnboarding && !onboardingDone && !terrainSessionReady) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <GrossisteBQuickOnboarding onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  return (
    <CommercialRouterProvider router={router} flags={routingInput.flags}>
      <div className="grossiste-b-app" data-testid="grossiste-mobile-app">
        <GrossisteBTerrainHeader
          activeTab={activeTab}
          onMessaging={() => setActiveTab("messaging")}
          onProfile={() => setActiveTab("profile")}
        />
        <GrossisteBAppContent
          activeTab={activeTab}
          enabled={enabled}
          routingInput={routingInput}
          focusReference={focusReference}
          canGoBack={canGoBack}
          goBack={goBack}
          onOpenWallet={() => setActiveTab("wallet")}
        />
        <GrossisteBBottomTabs activeTab={activeTab} onSelect={setActiveTab} />
      </div>
    </CommercialRouterProvider>
  );
}
