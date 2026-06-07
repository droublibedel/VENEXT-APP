import { lazy, Suspense, useCallback, useEffect, useState } from "react";

import { CommercialRouterProvider } from "commercial-context-routing";

import {
  TerrainAuthScreen,
  TerrainProfileHostUnavailable,
  attachTerrainProfileOnlineSync,
  bootTerrainProfileFromBackend,
  ensureTerrainProfileIdentity,
  resolveTerrainProfileBootstrap,
  resolveTerrainProfileHostState,
  setTerrainUserKey,
  useTerrainProfileRuntimeOptional,
} from "commerce-terrain-profile-runtime";

import { useVenextAuthOptional } from "venext-auth-foundation";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
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
  saveDetaillantOnboardingProfile,
} from "../onboarding/detaillant-onboarding.viewmodel";
import { DetaillantBottomTabs } from "../navigation/DetaillantBottomTabs";
import { DetaillantTerrainHeader } from "../navigation/DetaillantTerrainHeader";
import type { DetaillantTabId } from "../navigation/detaillant-navigation.config";
import { useDetaillantCommercialRouter } from "../routing/useDetaillantCommercialRouter";
import { DETAILLANT_LOGOUT_EVENT } from "../session/detaillant-session";
import { DetaillantTerrainProfileRouter } from "./DetaillantTerrainProfileRouter";
import {
  subscribeTerrainNavigationReset,
} from "commerce-terrain-profile-runtime";
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

export function DetaillantAppShell({ terrainShellHost = false }: { terrainShellHost?: boolean } = {}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const profileRuntime = useTerrainProfileRuntimeOptional();
  const auth = useVenextAuthOptional();
  const hostState = resolveTerrainProfileHostState({
    expectedProfile: "detaillant",
    activeProfile: profileRuntime?.activeProfile ?? (terrainShellHost ? "detaillant" : null),
    mobileEnabled: flags.detaillant_mobile_enabled,
    hydrated,
  });
  const authFoundation = hydrated && flags.venext_auth_foundation_enabled !== false;
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
          organizationId: legacy.organizationId,
        });
      }
    }
  }, [auth, authFoundation]);

  const handleReconnect = useCallback(
    (result: { organizationId: string; profile: Record<string, unknown> }) => {
      const phone = String(result.profile.phone ?? "");
      saveDetaillantOnboardingProfile({
        phone,
        otpVerified: true,
        displayName: String(result.profile.displayName ?? ""),
        activities: Array.isArray(result.profile.activities)
          ? (result.profile.activities as string[])
          : [],
        city: String(result.profile.city ?? ""),
        organizationId: result.organizationId,
      });
      const userKey = phone.replace(/\D/g, "").slice(-10) || result.organizationId;
      setTerrainUserKey(userKey);
      void bootTerrainProfileFromBackend(userKey).then((state) => {
        if (!state.primaryProfile) {
          const profile = resolveTerrainProfileBootstrap(userKey, "detaillant");
          return ensureTerrainProfileIdentity(userKey, profile, "settings");
        }
        return undefined;
      });
      handleOnboardingComplete();
    },
    [handleOnboardingComplete],
  );

  useEffect(() => {
    const profile = loadDetaillantOnboardingProfile();
    if (!profile?.phone && !profile?.organizationId) return;
    const userKey =
      profile.phone.replace(/\D/g, "").slice(-10) ||
      profile.organizationId ||
      "";
    if (!userKey) return;
    setTerrainUserKey(userKey);
    void bootTerrainProfileFromBackend(userKey);
    return attachTerrainProfileOnlineSync(userKey);
  }, [onboardingDone, terrainSessionReady]);

  useEffect(() => {
    return subscribeTerrainNavigationReset(({ profile, defaultTab }) => {
      if (profile === "detaillant") {
        setActiveTab(defaultTab as DetaillantTabId);
      }
    });
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setOnboardingDone(false);
      setActiveTab("home");
    };
    window.addEventListener(DETAILLANT_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(DETAILLANT_LOGOUT_EVENT, onLogout);
  }, []);

  const { router, routingInput, focusReference, canGoBack, goBack } =
    useDetaillantCommercialRouter(setActiveTab, { flags, hydrated });

  if (hostState === "loading") {
    return (
      <div className="detaillant-app" data-testid="detaillant-mobile-loading">
        <ScreenLoader />
      </div>
    );
  }

  if (hostState === "unavailable") {
    return <TerrainProfileHostUnavailable profile="detaillant" />;
  }

  if (needsQuickOnboarding && !onboardingDone && !terrainSessionReady) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <TerrainAuthScreen
          actorRole="DETAILLANT"
          onAuthenticated={handleReconnect}
          renderRegister={({ onSwitchToLogin }) => (
            <DetaillantQuickOnboarding
              onComplete={handleOnboardingComplete}
              onSwitchToLogin={onSwitchToLogin}
            />
          )}
        />
      </Suspense>
    );
  }

  const appContent = (
    <CommercialRouterProvider router={router} flags={routingInput.flags}>
      <div className="detaillant-app" data-testid="detaillant-mobile-app">
        <DetaillantTerrainHeader
          onMessaging={() => setActiveTab("messaging")}
          onProfile={() => setActiveTab("account")}
        />
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

  if (terrainShellHost) return appContent;
  return <DetaillantTerrainProfileRouter>{appContent}</DetaillantTerrainProfileRouter>;
}
