import { useCallback, useMemo, useState } from "react";
import {
  getCommercialLocationProfile,
  hasExploitableLocation,
  saveManualCity,
  shouldShowSoftLocationPrompt,
  SoftCommercialLocationCompletion,
} from "commercial-location-terrain";

import { loadGrossisteBOnboardingProfile } from "../onboarding/grossiste-b-onboarding.viewmodel";

const ACTOR_ID = "org-grossiste-b-demo";

export function GrossisteBLocationBridge({ sessionCount = 1 }: { sessionCount?: number }) {
  const [hidden, setHidden] = useState(false);
  const profile = loadGrossisteBOnboardingProfile();
  const actorId = profile?.phone || ACTOR_ID;

  const show = useMemo(() => {
    if (hidden) return false;
    return shouldShowSoftLocationPrompt(actorId, {
      onboardingDone: true,
      sessionCount,
      sessionKey: "post_onboarding",
    });
  }, [actorId, hidden, sessionCount]);

  const onCompleted = useCallback(async () => {
    const legacy = loadGrossisteBOnboardingProfile();
    const loc = getCommercialLocationProfile(actorId);
    if (legacy && loc?.city && !legacy.city) {
      const { saveGrossisteBOnboardingProfile } = await import("../onboarding/grossiste-b-onboarding.viewmodel");
      saveGrossisteBOnboardingProfile({ ...legacy, city: loc.city });
    }
    setHidden(true);
  }, [actorId]);

  if (!show || hasExploitableLocation(actorId)) return null;

  if (profile?.city && !hasExploitableLocation(actorId)) {
    void saveManualCity(actorId, profile.city);
    return null;
  }

  return (
    <SoftCommercialLocationCompletion
      actorId={actorId}
      sessionKey="post_onboarding"
      onCompleted={() => void onCompleted()}
      onDismiss={() => setHidden(true)}
    />
  );
}
