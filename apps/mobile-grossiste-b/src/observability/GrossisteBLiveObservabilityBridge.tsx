import { useEffect } from "react";
import {
  bindCommerceObservabilityScreen,
  initCommerceOperationalObservability,
} from "commerce-operational-observability";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";

/** Télémétrie live silencieuse → back-office pilotage (BACKOFFICE-01-D). */
export function GrossisteBLiveObservabilityBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();

  useEffect(() => {
    if (!hydrated) return;
    initCommerceOperationalObservability({
      application: "mobile-grossiste-b",
      platform: "android",
      enabled: flags.commerce_humanized_errors_enabled !== false,
      getContext: () => {
        const route = typeof window !== "undefined" ? window.location.pathname : undefined;
        const screen = route ?? "mobile-grossiste-b";
        bindCommerceObservabilityScreen(route ?? "/", screen, "mobile-grossiste-b");
        return {
          route,
          screen,
          module: "mobile-grossiste-b",
          deviceType: "mobile",
          language: "fr-CI",
          networkState: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
          offlineState: typeof navigator !== "undefined" && !navigator.onLine,
        };
      },
    });
  }, [flags.commerce_humanized_errors_enabled, hydrated]);

  return null;
}
