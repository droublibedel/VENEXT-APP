import { lazy, Suspense, useCallback, useState } from "react";

import { CommercialRouterProvider } from "commercial-context-routing";

import { useVenextAuthOptional } from "venext-auth-foundation";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DetaillantNotificationsBridge } from "../notifications/DetaillantNotificationsBridge";
import { DetaillantOfflineBridge } from "../offline/DetaillantOfflineBridge";
import { DetaillantHumanizedErrorsBridge } from "../errors/DetaillantHumanizedErrorsBridge";
import { DetaillantLiveObservabilityBridge } from "../observability/DetaillantLiveObservabilityBridge";
import { DetaillantPerformanceBridge } from "../performance/DetaillantPerformanceBridge";
import { DetaillantLocationBridge } from "../location/DetaillantLocationBridge";
import { DetaillantUxHarmonyBridge } from "../ux/DetaillantUxHarmonyBridge";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";
import {
  isDetaillantOnboardingComplete,
  loadDetaillantOnboardingProfile,
} from "../onboarding/detaillant-onboarding.viewmodel";
import { DetaillantBottomTabs } from "../navigation/DetaillantBottomTabs";
import type { DetaillantTabId } from "../navigation/detaillant-navigation.config";
import { useDetaillantCommercialRouter } from "../routing/useDetaillantCommercialRouter";
import { DetaillantAccountScreen } from "../screens/DetaillantAccountScreen";
import { DetaillantHomeScreen } from "../screens/DetaillantHomeScreen";
import { DetaillantNetworkScreen } from "../screens/DetaillantNetworkScreen";
import { DetaillantOrdersScreen } from "../screens/DetaillantOrdersScreen";
import { DetaillantProductsScreen } from "../screens/DetaillantProductsScreen";

const DetaillantMessagingScreen = lazy(() =>
  import("../messaging/DetaillantMessagingScreen").then((m) => ({
    default: m.DetaillantMessagingScreen,
  })),
);
const DetaillantQuickOnboarding = lazy(() =>
  import("../onboarding/DetaillantQuickOnboarding").then((m) => ({
    default: m.DetaillantQuickOnboarding,
  })),
);

function ScreenLoader({ variant }: { variant?: "messaging" | "dashboard" }) {
  return <VenextScreenLoader variant={variant ?? "dashboard"} />;
}

function DetaillantQuickReturnBar({
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
      className="detaillant-quick-return"
      data-testid="detaillant-commercial-quick-return"
      onClick={goBack}
      style={{
        margin: "8px 12px",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #2a3530",
        background: "#121816",
        color: "#b8c9c0",
        fontSize: 13,
        width: "calc(100% - 24px)",
      }}
    >
      ← Retour au flux précédent
    </button>
  );
}

export function DetaillantAppShell() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const auth = useVenextAuthOptional();
  const authFoundation = hydrated && flags.venext_auth_foundation_enabled !== false;
  const enabled = hydrated && flags.detaillant_mobile_enabled !== false;
  const needsQuickOnboarding = hydrated && flags.terrain_quick_onboarding_enabled !== false;
  const terrainSessionReady =
    !authFoundation || (auth?.isAuthenticated ?? false) || isDetaillantOnboardingComplete();
  const [activeTab, setActiveTab] = useState<DetaillantTabId>("home");
  const [onboardingDone, setOnboardingDone] = useState(() => isDetaillantOnboardingComplete());
  const handleOnboardingComplete = useCallback(() => {
    setOnboardingDone(true);
    if (authFoundation && auth) {
      const legacy = loadDetaillantOnboardingProfile();
      if (legacy?.phone && legacy.displayName) {
        auth.establishTerrainSession({
          phone: legacy.phone,
          displayName: legacy.displayName,
          activities: legacy.activities ?? [],
          city: legacy.city,
          otpVerified: true,
        });
      }
    }
  }, [auth, authFoundation]);

  const { router, routingInput, focusReference, canGoBack, goBack } =
    useDetaillantCommercialRouter(setActiveTab);

  if (!enabled) {
    return (
      <div className="detaillant-app" data-testid="detaillant-mobile-disabled">
        <main className="detaillant-main">
          <p style={{ padding: 24, color: "#8fa39a", fontSize: 15 }}>
            Application détaillant — bientôt disponible sur votre compte.
          </p>
        </main>
      </div>
    );
  }

  if (needsQuickOnboarding && !onboardingDone && !terrainSessionReady) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <DetaillantQuickOnboarding onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  return (
    <CommercialRouterProvider router={router} flags={routingInput.flags}>
      <div className="detaillant-app" data-testid="detaillant-mobile-app">
        <div style={{ position: "fixed", top: 8, right: 8, zIndex: 100 }}>
          <DetaillantNotificationsBridge />
        </div>
        <DetaillantQuickReturnBar canGoBack={canGoBack} goBack={goBack} />
        <DetaillantLocationBridge />
        <DetaillantUxHarmonyBridge />
        <DetaillantHumanizedErrorsBridge />
        <DetaillantLiveObservabilityBridge />
        <DetaillantPerformanceBridge />
        <DetaillantOfflineBridge />
        <main className="detaillant-main" data-testid={`detaillant-main-${activeTab}`}>
          {activeTab === "home" ? <DetaillantHomeScreen enabled routingInput={routingInput} /> : null}
          {activeTab === "messaging" ? (
            <Suspense fallback={<ScreenLoader />}>
              <DetaillantMessagingScreen enabled routingInput={routingInput} />
            </Suspense>
          ) : null}
          {activeTab === "products" ? <DetaillantProductsScreen enabled routingInput={routingInput} /> : null}
          {activeTab === "orders" ? (
            <DetaillantOrdersScreen
              enabled
              routingInput={routingInput}
              focusReference={focusReference}
            />
          ) : null}
          {activeTab === "network" ? <DetaillantNetworkScreen enabled /> : null}
          {activeTab === "account" ? <DetaillantAccountScreen enabled routingInput={routingInput} /> : null}
        </main>
        <DetaillantBottomTabs activeTab={activeTab} onSelect={setActiveTab} />
      </div>
    </CommercialRouterProvider>
  );
}
