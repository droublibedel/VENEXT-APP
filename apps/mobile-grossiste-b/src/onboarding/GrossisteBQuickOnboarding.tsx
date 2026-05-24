import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  OPERATIONAL_JOURNEY_EVENTS,
  wireAuthOtpStep,
  wireJourneyAbandonOnUnmount,
  trackJourneyComplete,
  trackJourneyStart,
  trackJourneyStep,
} from "commerce-operational-observability";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

import type { GrossisteBOnboardingProfile, GrossisteBOnboardingStep } from "./grossiste-b-onboarding.types";
import { GrossisteBOnboardingAudioHint } from "./GrossisteBOnboardingAudioHint";
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
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState<GrossisteBOnboardingStep>("phone");
  const [showAudioHint, setShowAudioHint] = useState(false);
  const [profile, setProfile] = useState<GrossisteBOnboardingProfile>(createEmptyGrossisteBProfile);
  const onboardingJourneyId = useRef<string | null>(null);

  useEffect(() => {
    onboardingJourneyId.current = trackJourneyStart({
      journeyKey: "terrain_onboarding",
      actorId: profile.phone || "anonymous",
      actorRole: "GROSSISTE_B",
      application: "mobile-grossiste-b",
      screen: "auth.otp",
      module: "onboarding",
    });
    wireAuthOtpStep(onboardingJourneyId.current, { screen: "auth.otp" });
    return () => {
      wireJourneyAbandonOnUnmount(onboardingJourneyId.current, "onboarding");
      onboardingJourneyId.current = null;
    };
  }, []);

  useEffect(() => {
    if (!onboardingJourneyId.current) return;
    trackJourneyStep(onboardingJourneyId.current, `onboarding_${step}`, { screen: `onboarding.${step}` });
  }, [step]);

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

  const completeAfterAudio = useCallback(() => {
    setShowAudioHint(false);
    onComplete();
  }, [onComplete]);

  const finish = useCallback(() => {
    const done = { ...profile, completedAt: new Date().toISOString() };
    saveGrossisteBOnboardingProfile(done);
    if (onboardingJourneyId.current) {
      trackJourneyComplete(onboardingJourneyId.current, OPERATIONAL_JOURNEY_EVENTS.AUTH.ENTERPRISE_INVITATION_COMPLETE, {
        screen: "onboarding.complete",
      });
      onboardingJourneyId.current = null;
    }
    setShowAudioHint(true);
  }, [profile]);

  const stepIndex = useMemo(() => {
    const order: GrossisteBOnboardingStep[] = ["phone", "identity", "activities", "city"];
    return order.indexOf(step) + 1;
  }, [step]);

  if (showAudioHint) {
    return (
      <div className="grossiste-b-app" data-testid="gb-quick-onboarding-audio">
        <main className="grossiste-b-main" style={{ padding: 16 }}>
          <GrossisteBOnboardingAudioHint
            ownerActorId={profile.phone || "org-grossiste-b-demo"}
            onDismiss={completeAfterAudio}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="grossiste-b-app" data-testid="gb-quick-onboarding">
      <main className="grossiste-b-main" style={{ padding: 16 }}>
        <p style={{ fontSize: 11, color: "var(--venext-accent)", margin: "0 0 12px" }} data-testid="gb-onboarding-progress">
          Étape {stepIndex} / 4 — inscription terrain rapide
        </p>
        <Suspense fallback={<VenextScreenLoader variant="form" />}>
          {step === "phone" ? (
            <GrossisteBPhoneStep
              phone={profile.phone}
              otpVerified={profile.otpVerified}
              onPhoneChange={(phone) => patch({ phone })}
              onOtpVerified={() => patch({ otpVerified: true })}
              onNext={() => setStep("identity")}
            />
          ) : null}
          {step === "identity" ? (
            <GrossisteBIdentityStep
              displayName={profile.displayName}
              businessName={profile.businessName ?? ""}
              onDisplayNameChange={(displayName) => patch({ displayName })}
              onBusinessNameChange={(businessName) => patch({ businessName: businessName || undefined })}
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
            <GrossisteBCityStep
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
