import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import {
  ensureTerrainProfileIdentity,
  getTerrainProfileState,
  loadTerrainProfileState,
  resolveTerrainProfileBootstrap,
  saveTerrainProfileState,
  setTerrainUserKey,
  TerrainProfileSelectionStep,
} from "commerce-terrain-profile-runtime";
import { terrainOnboardingProgressLabel, type TerrainOnboardingStepKey } from "commerce-ux-harmony";

import { VenextScreenLoader } from "../ux/VenextScreenLoader";

import type { DetaillantOnboardingProfile, DetaillantOnboardingStep } from "./detaillant-onboarding.types";
import type { TerrainProfileId } from "commerce-terrain-profile-runtime";
import { completeDetaillantRegistration } from "./detaillant-onboarding-api";
import { toInternationalCiPhone } from "./detaillant-phone";
import { createEmptyDetaillantProfile, saveDetaillantOnboardingProfile } from "./detaillant-onboarding.viewmodel";

const DetaillantPhoneStep = lazy(() =>
  import("./DetaillantPhoneStep").then((m) => ({ default: m.DetaillantPhoneStep })),
);
const DetaillantIdentityStep = lazy(() =>
  import("./DetaillantIdentityStep").then((m) => ({ default: m.DetaillantIdentityStep })),
);
const DetaillantActivitiesStep = lazy(() =>
  import("./DetaillantActivitiesStep").then((m) => ({ default: m.DetaillantActivitiesStep })),
);
const DetaillantCityStep = lazy(() =>
  import("./DetaillantCityStep").then((m) => ({ default: m.DetaillantCityStep })),
);

export const DetaillantQuickOnboarding = memo(function DetaillantQuickOnboarding({
  onComplete,
  onSwitchToLogin,
}: {
  onComplete: () => void;
  onSwitchToLogin?: () => void;
}) {
  const [step, setStep] = useState<DetaillantOnboardingStep>(() =>
    getTerrainProfileState().primaryProfile ? "phone" : "profile",
  );
  const [terrainProfileChoice, setTerrainProfileChoice] = useState<TerrainProfileId | null>(
    getTerrainProfileState().primaryProfile ?? "detaillant",
  );
  const [profile, setProfile] = useState<DetaillantOnboardingProfile>(createEmptyDetaillantProfile);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<DetaillantOnboardingProfile>) => {
    setProfile((p) => ({ ...p, ...partial }));
  }, []);

  const toggleActivity = useCallback((activity: string) => {
    setProfile((p) => {
      const has = p.activities.includes(activity);
      return {
        ...p,
        activities: has ? p.activities.filter((a) => a !== activity) : [...p.activities, activity],
      };
    });
  }, []);

  const finish = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    const result = await completeDetaillantRegistration({
      phone: toInternationalCiPhone(profile.phone),
      registrationToken: profile.registrationToken,
      displayName: profile.displayName,
      activities: profile.activities,
      city: profile.city || "Abidjan",
      devBypassOtp: import.meta.env.DEV && profile.otpVerified && !profile.registrationToken,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.userMessage);
      return;
    }
    const done = {
      ...profile,
      organizationId: result.organizationId,
      completedAt: new Date().toISOString(),
    };
    saveDetaillantOnboardingProfile(done);
    const userKey =
      toInternationalCiPhone(profile.phone).replace(/\D/g, "").slice(-10) || result.organizationId;
    setTerrainUserKey(userKey);
    const chosen =
      terrainProfileChoice ?? resolveTerrainProfileBootstrap(userKey, "detaillant");
    try {
      await ensureTerrainProfileIdentity(userKey, chosen, "onboarding");
    } catch {
      // Le compte commerce est créé ; la synchro profil sera retentée à la connexion.
    }
    onComplete();
  }, [profile, onComplete, terrainProfileChoice]);

  const stepIndex = useMemo(() => {
    const order: DetaillantOnboardingStep[] = ["profile", "phone", "identity", "activities", "city"];
    return order.indexOf(step) + 1;
  }, [step]);

  const progressLabel = useMemo(
    () => terrainOnboardingProgressLabel(stepIndex, step as TerrainOnboardingStepKey),
    [step, stepIndex],
  );

  return (
    <div className="detaillant-app" data-testid="dt-quick-onboarding">
      <main className="detaillant-main" style={{ padding: 16 }}>
        {onSwitchToLogin && step === "profile" ? (
          <button
            type="button"
            data-testid="dt-onboarding-to-login"
            onClick={onSwitchToLogin}
            style={{
              marginBottom: 12,
              border: "none",
              background: "transparent",
              color: "var(--venext-accent)",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Déjà inscrit ? Se connecter
          </button>
        ) : null}
        <p style={{ fontSize: 11, color: "var(--venext-accent)", margin: "0 0 12px" }} data-testid="dt-onboarding-progress">
          {progressLabel}
        </p>
        <Suspense fallback={<VenextScreenLoader variant="form" />}>
          {step === "profile" ? (
            <TerrainProfileSelectionStep
              selected={terrainProfileChoice}
              onSelect={setTerrainProfileChoice}
              onContinue={() => {
                if (!terrainProfileChoice) return;
                const state = loadTerrainProfileState();
                saveTerrainProfileState({
                  ...state,
                  primaryProfile: terrainProfileChoice,
                  currentActiveProfile: terrainProfileChoice,
                  enabledProfiles: state.enabledProfiles.includes(terrainProfileChoice)
                    ? state.enabledProfiles
                    : [...state.enabledProfiles, terrainProfileChoice],
                });
                setStep("phone");
              }}
            />
          ) : null}
          {step === "phone" ? (
            <DetaillantPhoneStep
              phone={profile.phone}
              otpVerified={profile.otpVerified}
              onPhoneChange={(phone) => patch({ phone })}
              onOtpVerified={(registrationToken) =>
                patch({ otpVerified: true, registrationToken })
              }
              onNext={() => setStep("identity")}
            />
          ) : null}
          {step === "identity" ? (
            <DetaillantIdentityStep
              displayName={profile.displayName}
              onDisplayNameChange={(displayName) => patch({ displayName })}
              onNext={() => setStep("activities")}
            />
          ) : null}
          {step === "activities" ? (
            <DetaillantActivitiesStep
              selected={profile.activities}
              onToggle={toggleActivity}
              onNext={() => setStep("city")}
            />
          ) : null}
          {step === "city" ? (
            <>
              {submitError ? (
                <p role="alert" style={{ color: "var(--venext-danger, #b42318)", fontSize: 13, marginBottom: 12 }}>
                  {submitError}
                </p>
              ) : null}
              <DetaillantCityStep
                city={profile.city}
                onCityChange={(city) => patch({ city })}
                onFinish={() => void finish()}
                onSkip={() => void finish()}
                submitting={submitting}
              />
            </>
          ) : null}
        </Suspense>
      </main>
    </div>
  );
});
