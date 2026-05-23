import { useEffect } from "react";
import {
  bindCommerceObservabilityScreen,
  initCommerceOperationalObservability,
} from "commerce-operational-observability";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";

/** Télémétrie live silencieuse → back-office pilotage (BACKOFFICE-01-D). */
export function DetaillantLiveObservabilityBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();

  useEffect(() => {
    if (!hydrated) return;
    initCommerceOperationalObservability({
      application: "mobile-detaillant",
      platform: "android",
      enabled: flags.commerce_humanized_errors_enabled !== false,
      getContext: () => {
        const route = typeof window !== "undefined" ? window.location.pathname : undefined;
        const screen = route ?? "mobile-detaillant";
        bindCommerceObservabilityScreen(route ?? "/", screen, "mobile-detaillant");
        return {
          route,
          screen,
          module: "mobile-detaillant",
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
