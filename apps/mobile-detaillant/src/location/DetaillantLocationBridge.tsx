import { useCallback, useMemo, useState } from "react";
import {
  hasExploitableLocation,
  shouldShowSoftLocationPrompt,
  SoftCommercialLocationCompletion,
} from "commercial-location-terrain";

import { loadDetaillantOnboardingProfile } from "../onboarding/detaillant-onboarding.viewmodel";

const ACTOR_ID = "org-detaillant-yopougon";

export function DetaillantLocationBridge({ sessionCount = 1 }: { sessionCount?: number }) {
  const [hidden, setHidden] = useState(false);
  const profile = loadDetaillantOnboardingProfile();
  const actorId = profile?.phone || ACTOR_ID;

  const show = useMemo(() => {
    if (hidden) return false;
    return shouldShowSoftLocationPrompt(actorId, {
      onboardingDone: true,
      sessionCount,
      sessionKey: "post_onboarding",
    });
  }, [actorId, hidden, sessionCount]);

  const onCompleted = useCallback(() => setHidden(true), []);

  if (!show || hasExploitableLocation(actorId)) return null;

  return (
    <SoftCommercialLocationCompletion
      actorId={actorId}
      sessionKey="post_onboarding"
      onCompleted={onCompleted}
      onDismiss={() => setHidden(true)}
    />
  );
}
