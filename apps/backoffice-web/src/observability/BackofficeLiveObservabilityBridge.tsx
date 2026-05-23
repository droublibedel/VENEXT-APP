"use client";

import { useEffect } from "react";
import {
  bindCommerceObservabilityScreen,
  initCommerceOperationalObservability,
  OPERATIONAL_JOURNEY_EVENTS,
  trackJourneyStart,
  trackJourneyStep,
} from "commerce-operational-observability";

/** Télémétrie live silencieuse (auto-pilotage) — BACKOFFICE-01-D. */
export function BackofficeLiveObservabilityBridge() {
  useEffect(() => {
    initCommerceOperationalObservability({
      application: "backoffice-web",
      platform: "web",
      bffBaseUrl: "/api/bff",
      releaseChannel: "backoffice",
      getContext: () => {
        const route = typeof window !== "undefined" ? window.location.pathname : undefined;
        const screen = route ?? "backoffice-web";
        bindCommerceObservabilityScreen(route ?? "/", screen, "backoffice-web");
        return {
          route,
          screen,
          module: "backoffice-web",
          deviceType: "desktop",
          language: "fr-CI",
          actorRole: "BACKOFFICE_OPERATOR",
          networkState: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
          offlineState: typeof navigator !== "undefined" && !navigator.onLine,
        };
      },
    });

    const journeyId = trackJourneyStart({
      journeyKey: "backoffice_operator",
      actorId: "operator-session",
      actorRole: "BACKOFFICE_OPERATOR",
      application: "backoffice-web",
      screen: "backoffice.login",
      module: "backoffice-web",
    });
    trackJourneyStep(journeyId, OPERATIONAL_JOURNEY_EVENTS.BACKOFFICE.OPERATOR_LOGIN, {
      screen: "backoffice.login",
    });
  }, []);

  return null;
}
