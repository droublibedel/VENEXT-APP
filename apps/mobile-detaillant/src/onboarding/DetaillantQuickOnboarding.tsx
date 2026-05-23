import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

import type { DetaillantOnboardingProfile, DetaillantOnboardingStep } from "./detaillant-onboarding.types";
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

  const finish = useCallback(() => {
    const done = { ...profile, completedAt: new Date().toISOString() };
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
        <p style={{ fontSize: 11, color: "#00a884", margin: "0 0 12px" }} data-testid="dt-onboarding-progress">
          Étape {stepIndex} / 4 — inscription terrain rapide
        </p>
        <Suspense fallback={<VenextScreenLoader variant="form" />}>
          {step === "phone" ? (
            <DetaillantPhoneStep
              phone={profile.phone}
              otpVerified={profile.otpVerified}
              onPhoneChange={(phone) => patch({ phone })}
              onOtpVerified={() => patch({ otpVerified: true })}
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
            <DetaillantCityStep
              city={profile.city}
              onCityChange={(city) => patch({ city })}
              onFinish={finish}
              onSkip={finish}
            />
          ) : null}
        </Suspense>
      </main>
    </div>
  );
});
