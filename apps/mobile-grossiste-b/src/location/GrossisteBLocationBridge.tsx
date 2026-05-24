import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCommercialLocationProfile,
  hasExploitableLocation,
  saveManualCity,
  shouldShowTransientLocationHint,
  TransientLocationOptimizationHint,
} from "commercial-location-terrain";

import { loadGrossisteBOnboardingProfile } from "../onboarding/grossiste-b-onboarding.viewmodel";

const ACTOR_ID = "org-grossiste-b-demo";

export function GrossisteBLocationBridge({ sessionCount = 1 }: { sessionCount?: number }) {
  const [hidden, setHidden] = useState(false);
  const profile = loadGrossisteBOnboardingProfile();
  const actorId = profile?.phone || ACTOR_ID;
  const onboardingCity = profile?.city?.trim() ?? "";

  useEffect(() => {
    if (!onboardingCity || hasExploitableLocation(actorId)) return;
    void saveManualCity(actorId, onboardingCity);
  }, [actorId, onboardingCity]);

  const hasLocation = useMemo(
    () => hasExploitableLocation(actorId) || Boolean(onboardingCity),
    [actorId, onboardingCity],
  );

  const showHint = useMemo(() => {
    if (hidden || hasLocation) return false;
    return shouldShowTransientLocationHint(actorId, {
      onboardingDone: true,
      sessionCount,
      sessionKey: "post_onboarding",
      hasOnboardingCity: Boolean(onboardingCity),
    });
  }, [actorId, hidden, hasLocation, onboardingCity, sessionCount]);

  const onDismiss = useCallback(() => setHidden(true), []);

  if (!showHint) return null;

  const city = getCommercialLocationProfile(actorId)?.city ?? onboardingCity;
  const message = city
    ? "Activez votre position pour recevoir des partenaires proches."
    : "Ajoutez votre ville pour améliorer votre réseau.";

  return <TransientLocationOptimizationHint message={message} onDismiss={onDismiss} />;
}
