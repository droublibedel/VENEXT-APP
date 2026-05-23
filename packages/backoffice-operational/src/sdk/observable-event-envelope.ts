import type { LiveOperationalContext } from "../live-observability/backoffice-live-observability-context.js";
import {
  getCommerceObservabilityRuntime,
  inferDeviceClass,
  inferNetworkQuality,
} from "./commerce-observability-runtime.js";
import { getActiveCommerceJourney } from "./commerce-journey-session.js";

function newEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type ObservableEventEnvelopeInput = Partial<LiveOperationalContext> & {
  action?: string;
  severity?: string;
  status?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  journeyId?: string;
  commercialContext?: Record<string, unknown>;
};

/** Enveloppe standard BACKOFFICE-01-D — champs obligatoires + corrélation parcours. */
export function buildObservableEventEnvelope(
  input: ObservableEventEnvelopeInput = {},
): Record<string, unknown> {
  const rt = getCommerceObservabilityRuntime();
  const active = getActiveCommerceJourney();
  const networkQuality = rt.networkQuality === "unknown" ? inferNetworkQuality() : rt.networkQuality;
  const deviceClass = rt.deviceClass === "unknown" ? inferDeviceClass() : rt.deviceClass;

  const commercialContext: Record<string, unknown> = {
    enterpriseId: input.enterpriseId,
    relationshipId: input.relationshipId,
    partnerRole: input.partnerRole,
    pole: input.pole,
    feature: input.feature,
    journeyKey: active?.journeyKey,
    journeyStep: active?.step,
    ...(input.commercialContext ?? {}),
  };

  return {
    eventId: newEventId(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    app: input.app,
    platform: rt.platform,
    userId: input.userId,
    enterpriseId: input.enterpriseId,
    commercialContext,
    route: input.route,
    screen: input.screen ?? active?.screen,
    action: input.action ?? active?.action,
    module: input.module ?? active?.module,
    journeyId: input.journeyId ?? active?.journeyId,
    severity: input.severity ?? "info",
    status: input.status,
    duration: input.durationMs,
    metadata: input.metadata ?? {},
    appVersion: rt.appVersion,
    buildNumber: rt.buildNumber,
    releaseChannel: rt.releaseChannel,
    networkQuality,
    offlineMode: rt.offlineMode || networkQuality === "offline",
    retryCount: rt.retryCount,
    deviceClass,
    deviceType: input.deviceType,
    networkState: input.networkState,
    offlineState: input.offlineState,
  };
}
