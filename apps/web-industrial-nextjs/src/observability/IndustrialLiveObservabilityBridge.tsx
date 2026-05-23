"use client";

import { useEffect } from "react";
import {
  bindCommerceObservabilityScreen,
  initCommerceOperationalObservability,
} from "commerce-operational-observability";

/** Télémétrie live silencieuse → back-office pilotage (BACKOFFICE-01-D). */
export function IndustrialLiveObservabilityBridge() {
  useEffect(() => {
    initCommerceOperationalObservability({
      application: "web-industrial-nextjs",
      platform: "web",
      bffBaseUrl: "",
      getContext: () => {
        const route = typeof window !== "undefined" ? window.location.pathname : undefined;
        const screen = route ?? "web-industrial-nextjs";
        bindCommerceObservabilityScreen(route ?? "/", screen, "web-industrial-nextjs");
        return {
          route,
          screen,
          module: "web-industrial-nextjs",
          deviceType: "desktop",
          language: "fr-CI",
          networkState: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
          offlineState: typeof navigator !== "undefined" && !navigator.onLine,
        };
      },
    });
  }, []);

  return null;
}
