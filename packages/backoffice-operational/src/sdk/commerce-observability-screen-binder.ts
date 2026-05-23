import { trackOperationalSignal } from "./commerce-operational-observability.js";

let lastScreen = "";

/** Lie écran courant → signaux opérationnels (sans WebSocket). */
export function bindCommerceObservabilityScreen(route: string, screen: string, module: string): void {
  if (screen === lastScreen) return;
  lastScreen = screen;
  trackOperationalSignal({
    signal: "screen_view",
    level: "INFO",
    detail: route,
    partial: { route, screen, module },
  });
}

export function resetCommerceScreenBinderForTests(): void {
  lastScreen = "";
}
