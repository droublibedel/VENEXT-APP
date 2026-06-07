import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import {
  getTerrainProfileState,
  setPrimaryTerrainProfileAsync,
  TerrainProfileSelectionStep,
  type TerrainProfileId,
} from "commerce-terrain-profile-runtime";
import { terrainOnboardingProgressLabel, type TerrainOnboardingStepKey } from "commerce-ux-harmony";

import { VenextScreenLoader } from "../ux/VenextScreenLoader";

import type { GrossisteBOnboardingProfile, GrossisteBOnboardingStep } from "./grossiste-b-onboarding.types";
import { completeGrossisteBRegistration } from "./grossiste-b-onboarding-api";
import { toInternationalCiPhone } from "./grossiste-b-phone";
import { createEmptyGrossisteBProfile, saveGrossisteBOnboardingProfile } from "./grossiste-b-onboarding.viewmodel";

const GrossisteBPhoneStep = lazy(() =>
  import("./GrossisteBPhoneStep").then((m) => ({ default: m.GrossisteBPhoneStep })),
);
const GrossisteBIdentityStep = lazy(() =>
  import("./GrossisteBIdentityStep").then((m) => ({ default: m.GrossisteBIdentityStep })),
);
const GrossisteBActivitiesStep = lazy(() =>
  import("./GrossisteBActivitiesStep").then((m) => ({ default: m.GrossisteBActivitiesStep })),
);
const GrossisteBCityStep = lazy(() =>
  import("./GrossisteBCityStep").then((m) => ({ default: m.GrossisteBCityStep })),
);

export const GrossisteBQuickOnboarding = memo(function GrossisteBQuickOnboarding({
  onComplete,
  onSwitchToLogin,
}: {
  onComplete: () => void;
  onSwitchToLogin?: () => void;
}) {
  const [step, setStep] = useState<GrossisteBOnboardingStep>(() =>
    getTerrainProfileState().primaryProfile ? "phone" : "profile",
  );
  const [terrainProfileChoice, setTerrainProfileChoice] = useState<TerrainProfileId | null>(
    getTerrainProfileState().primaryProfile ?? "grossiste_b",
  );
  const [profile, setProfile] = useState<GrossisteBOnboardingProfile>(createEmptyGrossisteBProfile);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const patch = useCallback((partial: Partial<GrossisteBOnboardingProfile>) => {
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
    const result = await completeGrossisteBRegistration({
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
    saveGrossisteBOnboardingProfile(done);
    onComplete();
  }, [profile, onComplete]);

  const stepIndex = useMemo(() => {
    const order: GrossisteBOnboardingStep[] = ["profile", "phone", "identity", "activities", "city"];
    return order.indexOf(step) + 1;
  }, [step]);

  const progressLabel = useMemo(
    () => terrainOnboardingProgressLabel(stepIndex, step as TerrainOnboardingStepKey),
    [step, stepIndex],
  );

  return (
    <div className="grossiste-b-app" data-testid="gb-quick-onboarding">
      <main className="grossiste-b-main" style={{ padding: 16 }}>
        {onSwitchToLogin && step === "profile" ? (
          <button
            type="button"
            data-testid="gb-onboarding-to-login"
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
        <p style={{ fontSize: 11, color: "var(--venext-accent)", margin: "0 0 12px" }} data-testid="gb-onboarding-progress">
          {progressLabel}
        </p>
        <Suspense fallback={<VenextScreenLoader variant="form" />}>
          {step === "profile" ? (
            <TerrainProfileSelectionStep
              selected={terrainProfileChoice}
              onSelect={setTerrainProfileChoice}
              onContinue={() => {
                if (!terrainProfileChoice) return;
                void setPrimaryTerrainProfileAsync(terrainProfileChoice, "onboarding").then(() => {
                  setStep("phone");
                });
              }}
            />
          ) : null}
          {step === "phone" ? (
            <GrossisteBPhoneStep
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
            <GrossisteBIdentityStep
              displayName={profile.displayName}
              onDisplayNameChange={(displayName) => patch({ displayName })}
              onNext={() => setStep("activities")}
            />
          ) : null}
          {step === "activities" ? (
            <GrossisteBActivitiesStep
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
              <GrossisteBCityStep
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
