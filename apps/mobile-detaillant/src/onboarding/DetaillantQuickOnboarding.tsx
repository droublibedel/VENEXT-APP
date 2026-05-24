import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

import type { DetaillantOnboardingProfile, DetaillantOnboardingStep } from "./detaillant-onboarding.types";
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
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState<DetaillantOnboardingStep>("phone");
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
    onComplete();
  }, [profile, onComplete]);

  const stepIndex = useMemo(() => {
    const order: DetaillantOnboardingStep[] = ["phone", "identity", "activities", "city"];
    return order.indexOf(step) + 1;
  }, [step]);

  return (
    <div className="detaillant-app" data-testid="dt-quick-onboarding">
      <main className="detaillant-main" style={{ padding: 16 }}>
        <p style={{ fontSize: 11, color: "var(--venext-accent)", margin: "0 0 12px" }} data-testid="dt-onboarding-progress">
          Étape {stepIndex} / 4 — inscription terrain rapide
        </p>
        <Suspense fallback={<VenextScreenLoader variant="form" />}>
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
