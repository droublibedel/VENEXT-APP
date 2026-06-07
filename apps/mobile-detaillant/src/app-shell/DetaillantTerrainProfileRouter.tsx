import { lazy, memo, Suspense, useEffect, type ReactNode } from "react";
import {
  TerrainProfileTransitionOverlay,
  useTerrainProfileRuntime,
} from "commerce-terrain-profile-runtime";

import { VenextScreenLoader } from "../ux/VenextScreenLoader";
import {
  isGrossisteBOnboardingComplete,
  loadGrossisteBOnboardingProfile,
  saveGrossisteBOnboardingProfile,
} from "@venext/mobile-grossiste-b/onboarding/grossiste-b-onboarding.viewmodel";
import { loadDetaillantOnboardingProfile } from "../onboarding/detaillant-onboarding.viewmodel";

import { GrossisteBAuthProvider } from "@venext/mobile-grossiste-b/auth/GrossisteBAuthProvider";
import { GrossisteVenextLocale } from "@venext/mobile-grossiste-b/i18n/GrossisteVenextLocale";

const GrossisteBAppShell = lazy(() =>
  import("@venext/mobile-grossiste-b/app-shell/GrossisteBAppShell").then((m) => ({
    default: m.GrossisteBAppShell,
  })),
);

function mirrorDetaillantOnboardingForGrossiste(): void {
  if (isGrossisteBOnboardingComplete()) return;
  const detaillant = loadDetaillantOnboardingProfile();
  if (!detaillant?.phone || !detaillant.displayName) return;
  const existing = loadGrossisteBOnboardingProfile();
  saveGrossisteBOnboardingProfile({
    phone: detaillant.phone,
    otpVerified: detaillant.otpVerified,
    displayName: detaillant.displayName,
    activities: detaillant.activities ?? [],
    city: detaillant.city || "Abidjan",
    organizationId: detaillant.organizationId ?? existing?.organizationId,
    completedAt: detaillant.completedAt ?? new Date().toISOString(),
  });
}

export const DetaillantTerrainProfileRouter = memo(function DetaillantTerrainProfileRouter({
  children,
}: {
  children: ReactNode;
}) {
  const { activeProfile, remountKey, isTransitioning } = useTerrainProfileRuntime();

  useEffect(() => {
    if (activeProfile === "grossiste_b") mirrorDetaillantOnboardingForGrossiste();
  }, [activeProfile]);

  if (activeProfile === "grossiste_b") {
    return (
      <div
        className="detaillant-app terrain-profile-shell"
        data-testid="detaillant-grossiste-profile-host"
        data-active-profile="grossiste_b"
        data-profile-remount={remountKey}
      >
        <TerrainProfileTransitionOverlay visible={isTransitioning} profile="grossiste_b" />
        <Suspense fallback={<VenextScreenLoader variant="dashboard" />}>
          <GrossisteVenextLocale>
            <GrossisteBAuthProvider>
              <GrossisteBAppShell key={`gb-${remountKey}`} />
            </GrossisteBAuthProvider>
          </GrossisteVenextLocale>
        </Suspense>
      </div>
    );
  }

  return (
    <div data-active-profile={activeProfile ?? "detaillant"} data-profile-remount={remountKey}>
      <TerrainProfileTransitionOverlay visible={isTransitioning} profile="detaillant" />
      {children}
    </div>
  );
});
