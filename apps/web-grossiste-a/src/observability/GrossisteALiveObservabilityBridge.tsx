import { useEffect } from "react";
import {
  bindCommerceObservabilityScreen,
  initCommerceOperationalObservability,
} from "commerce-operational-observability";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";

/** Télémétrie live silencieuse → back-office pilotage (BACKOFFICE-01-D). */
export function GrossisteALiveObservabilityBridge() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();

  useEffect(() => {
    if (!hydrated) return;
    initCommerceOperationalObservability({
      application: "web-grossiste-a",
      platform: "web",
      enabled: flags.commerce_humanized_errors_enabled !== false,
      getContext: () => {
        const route = typeof window !== "undefined" ? window.location.pathname : undefined;
        const screen = route ?? "web-grossiste-a";
        bindCommerceObservabilityScreen(route ?? "/", screen, "web-grossiste-a");
        return {
          route,
          screen,
          module: "web-grossiste-a",
          deviceType: "desktop",
          language: "fr-CI",
          networkState: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
          offlineState: typeof navigator !== "undefined" && !navigator.onLine,
        };
      },
    });
  }, [flags.commerce_humanized_errors_enabled, hydrated]);

  return null;
}
