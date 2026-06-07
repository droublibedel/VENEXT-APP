import { lazy, memo, Suspense, useCallback, useEffect, useState } from "react";
import {
  ProfileRuntimeProvider,
  TerrainProfileSelectionStep,
  TerrainProfileTransitionOverlay,
  attachTerrainProfileOnlineSync,
  bootTerrainProfileFromBackend,
  getDeviceId,
  registerProfileCachePurgeHandler,
  setTerrainUserKey,
  useTerrainProfileRuntime,
  type TerrainProfileId,
} from "commerce-terrain-profile-runtime";

import { loadDetaillantOnboardingProfile } from "@venext/mobile-detaillant/onboarding/detaillant-onboarding.viewmodel";
import { loadGrossisteBOnboardingProfile } from "@venext/mobile-grossiste-b/onboarding/grossiste-b-onboarding.viewmodel";
import { clearDetaillantDataCache } from "@venext/mobile-detaillant/hooks/useDetaillantLiveData";
import { clearGrossisteDataCache } from "@venext/mobile-grossiste-b/hooks/useGrossisteLiveData";

registerProfileCachePurgeHandler((profile) => {
  if (profile === "detaillant") clearDetaillantDataCache();
  if (profile === "grossiste_b") clearGrossisteDataCache();
});

const DetaillantProfileHost = lazy(() =>
  import("./profiles/DetaillantProfileHost").then((m) => ({ default: m.DetaillantProfileHost })),
);
const GrossisteBProfileHost = lazy(() =>
  import("./profiles/GrossisteBProfileHost").then((m) => ({ default: m.GrossisteBProfileHost })),
);

function resolveTerrainUserKey(): string {
  const detaillant = loadDetaillantOnboardingProfile();
  const grossiste = loadGrossisteBOnboardingProfile();
  const phone = detaillant?.phone || grossiste?.phone;
  if (phone) return phone.replace(/\D/g, "").slice(-10) || phone;
  const orgId = detaillant?.organizationId || grossiste?.organizationId;
  if (orgId) return orgId;
  return getDeviceId();
}

const TerrainProfileGate = memo(function TerrainProfileGate() {
  const { setPrimaryProfile, switchError } = useTerrainProfileRuntime();
  const [selected, setSelected] = useState<TerrainProfileId | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = useCallback(async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await setPrimaryProfile(selected);
    } finally {
      setSubmitting(false);
    }
  }, [selected, setPrimaryProfile, submitting]);

  const errorMessage =
    switchError === "invalid_user"
      ? "Identifiant utilisateur invalide. Réessayez ou redémarrez l'application."
      : switchError;

  return (
    <div className="terrain-profile-shell terrain-profile-gate" data-testid="terrain-mobile-shell-gate">
      <p className="terrain-profile-badge" data-testid="terrain-app-brand">
        VENEXT
      </p>
      <TerrainProfileSelectionStep
        selected={selected}
        onSelect={setSelected}
        onContinue={() => void handleContinue()}
        submitting={submitting}
        errorMessage={errorMessage}
      />
    </div>
  );
});

const TerrainProfileRouter = memo(function TerrainProfileRouter() {
  const { activeProfile, remountKey, isTransitioning, isCachedProfile } = useTerrainProfileRuntime();

  if (!activeProfile) return null;

  return (
    <div
      className="terrain-profile-shell"
      data-testid="terrain-mobile-shell"
      data-active-profile={activeProfile}
      data-profile-remount={remountKey}
      data-profile-transition={isTransitioning ? "true" : "false"}
      data-cached-profile={isCachedProfile ? "true" : "false"}
    >
      <TerrainProfileTransitionOverlay visible={isTransitioning} profile={activeProfile} />
      <div className="terrain-profile-host">
        <Suspense fallback={<p style={{ padding: 24 }}>Chargement du profil…</p>}>
          {activeProfile === "grossiste_b" ? (
            <GrossisteBProfileHost key={`gb-${remountKey}`} />
          ) : (
            <DetaillantProfileHost key={`dt-${remountKey}`} />
          )}
        </Suspense>
      </div>
    </div>
  );
});

function TerrainMobileShellInner() {
  const { state } = useTerrainProfileRuntime();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const userKey = resolveTerrainUserKey();
    setTerrainUserKey(userKey);
    void bootTerrainProfileFromBackend(userKey).finally(() => setHydrated(true));
    return attachTerrainProfileOnlineSync(userKey);
  }, []);

  if (!hydrated) {
    return (
      <div className="terrain-profile-shell" data-testid="terrain-mobile-shell-loading">
        <p style={{ padding: 24 }}>VENEXT…</p>
      </div>
    );
  }

  if (!state.primaryProfile) {
    return <TerrainProfileGate />;
  }

  return <TerrainProfileRouter />;
}

export const TerrainMobileShell = memo(function TerrainMobileShell() {
  return (
    <ProfileRuntimeProvider>
      <TerrainMobileShellInner />
    </ProfileRuntimeProvider>
  );
});
