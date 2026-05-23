import type { CommerceErrorKey } from "commerce-humanized-errors/dist/commerce-humanized-errors.types.js";

import type { LiveObservabilityApplication } from "../live-observability/backoffice-live-observability-context.js";
import {
  flushLiveObservabilityBuffer,
  initLiveBackofficeObservability,
  reportLiveBackofficeError,
  reportLiveJourneyEvent,
  reportLiveOperationalSignal,
  trackLiveJourneyAbandon,
  trackLiveJourneyFailure,
  trackLiveJourneyStart,
  trackLiveJourneyStep,
  trackLiveJourneySuccess,
} from "../live-observability/backoffice-live-observability.js";
import { buildObservableEventEnvelope } from "./observable-event-envelope.js";
import {
  clearActiveCommerceJourney,
  getActiveCommerceJourneyId,
  setActiveCommerceJourney,
  updateActiveCommerceJourneyStep,
} from "./commerce-journey-session.js";
import {
  configureCommerceObservabilityRuntime,
  getCommerceObservabilityRuntime,
  inferDeviceClass,
  inferNetworkQuality,
  readAppVersionFromEnv,
  type CommerceObservabilityPlatform,
} from "./commerce-observability-runtime.js";

export type CommerceOperationalApp = LiveObservabilityApplication;

export type InitCommerceOperationalObservabilityInput = {
  application: CommerceOperationalApp;
  bffBaseUrl?: string;
  telemetryKey?: string;
  enabled?: boolean;
  platform?: CommerceObservabilityPlatform;
  appVersion?: string;
  buildNumber?: string;
  releaseChannel?: string;
  getContext?: () => Record<string, unknown>;
};

export type CommerceJourneyTrackContext = {
  journeyKey: string;
  actorId: string;
  actorRole: string;
  application: string;
  userId?: string;
  userPhone?: string;
  screen?: string;
  module?: string;
  enterpriseId?: string;
};

export type ReportCommerceObservableErrorInput = {
  commerceErrorKey: CommerceErrorKey | string;
  technicalMessage: string;
  internalStack?: string;
  application: CommerceOperationalApp;
  screen?: string;
  action?: string;
  routeOrApi?: string;
  module?: string;
  userId?: string;
  userPhone?: string;
  userEmail?: string;
  actorRole?: string;
  severity?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

let commerceInitialized = false;

/** Point d'entrée unique apps VENEXT — interdit d'appeler le live SDK directement. */
export function initCommerceOperationalObservability(
  input: InitCommerceOperationalObservabilityInput,
): void {
  let env: Record<string, string | undefined> = {};
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    env = meta?.env ?? {};
  } catch {
    env = {};
  }
  const fromEnv = readAppVersionFromEnv(env);

  configureCommerceObservabilityRuntime({
    platform: input.platform ?? "web",
    appVersion: input.appVersion ?? fromEnv.appVersion,
    buildNumber: input.buildNumber ?? fromEnv.buildNumber,
    releaseChannel: input.releaseChannel ?? fromEnv.releaseChannel,
    networkQuality: inferNetworkQuality(),
    deviceClass: inferDeviceClass(),
    offlineMode: typeof navigator !== "undefined" && !navigator.onLine,
  });

  initLiveBackofficeObservability({
    application: input.application,
    bffBaseUrl: input.bffBaseUrl,
    telemetryKey: input.telemetryKey,
    enabled: input.enabled,
    getContext: () => {
      const base = buildObservableEventEnvelope(
        (input.getContext?.() ?? {}) as never,
      );
      return base;
    },
  });
  commerceInitialized = true;
}

export function isCommerceOperationalObservabilityReady(): boolean {
  return commerceInitialized;
}

/** Erreur observable avec corrélation parcours automatique. */
export function reportBackofficeObservableError(input: ReportCommerceObservableErrorInput): void {
  const envelope = buildObservableEventEnvelope({
    app: input.application,
    screen: input.screen,
    action: input.action,
    module: input.module,
    userId: input.userId,
    userPhone: input.userPhone,
    severity: input.severity ?? "error",
    status: "error",
    durationMs: input.durationMs,
    metadata: input.metadata,
    journeyId: getActiveCommerceJourneyId(),
  });

  reportLiveBackofficeError({
    commerceErrorKey: input.commerceErrorKey,
    technicalMessage: input.technicalMessage,
    internalStack: input.internalStack,
    application: input.application,
    screen: String(envelope.screen ?? input.screen),
    action: String(envelope.action ?? input.action),
    routeOrApi: input.routeOrApi ?? String(envelope.route ?? ""),
    module: input.module,
    userId: input.userId,
    userPhone: input.userPhone,
    userEmail: input.userEmail,
    actorRole: input.actorRole,
    severity: input.severity,
  });
}

export function trackJourneyStart(ctx: CommerceJourneyTrackContext): string {
  const eventKey = `${ctx.journeyKey}_started`;
  const partial = buildObservableEventEnvelope({
    app: ctx.application as CommerceOperationalApp,
    userId: ctx.userId,
    userPhone: ctx.userPhone,
    screen: ctx.screen,
    module: ctx.module,
    enterpriseId: ctx.enterpriseId,
    actorRole: ctx.actorRole,
    status: "IN_PROGRESS",
  });
  const journeyId = trackLiveJourneyStart(eventKey, partial);
  setActiveCommerceJourney(journeyId, {
    journeyKey: ctx.journeyKey,
    step: eventKey,
    screen: ctx.screen,
    module: ctx.module,
  });
  return journeyId;
}

export function trackJourneyStep(
  journeyId: string,
  stepKey: string,
  partial?: Record<string, unknown>,
): void {
  updateActiveCommerceJourneyStep(stepKey, {
    screen: partial?.screen as string | undefined,
    action: partial?.action as string | undefined,
    module: partial?.module as string | undefined,
  });
  trackLiveJourneyStep(journeyId, stepKey, {
    ...buildObservableEventEnvelope(partial as never),
    journeyId,
  });
}

export function trackJourneyComplete(
  journeyId: string,
  finalStep = "completed",
  partial?: Record<string, unknown>,
): void {
  trackLiveJourneySuccess(journeyId, finalStep, buildObservableEventEnvelope(partial as never));
  clearActiveCommerceJourney();
}

export function trackJourneyFailed(
  journeyId: string,
  reason: string,
  partial?: Record<string, unknown>,
): void {
  const step = String(partial?.step ?? "failed");
  trackLiveJourneyFailure(journeyId, step, reason, buildObservableEventEnvelope(partial as never));
  clearActiveCommerceJourney();
}

export function trackJourneyAbandon(
  journeyId: string,
  reason = "USER_LEFT",
  partial?: Record<string, unknown>,
): void {
  trackLiveJourneyAbandon(journeyId, reason, buildObservableEventEnvelope(partial as never));
  clearActiveCommerceJourney();
}

export function trackJourneyBlocked(
  journeyId: string,
  reason: string,
  partial?: Record<string, unknown>,
): void {
  const step = String(partial?.step ?? "blocked");
  reportLiveJourneyEvent({
    eventKey: `${step}_blocked`,
    step,
    status: "BLOCKED",
    failureReason: reason,
    partial: buildObservableEventEnvelope({ ...partial, journeyId }),
  });
  trackLiveJourneyFailure(journeyId, step, reason, buildObservableEventEnvelope(partial as never));
  clearActiveCommerceJourney();
}

export function trackOperationalSignal(input: {
  signal: string;
  level?: "INFO" | "WARNING" | "CRITICAL";
  detail?: string;
  partial?: Record<string, unknown>;
}): void {
  reportLiveOperationalSignal({
    ...input,
    partial: buildObservableEventEnvelope(input.partial as never),
  });
}

export function recordObservabilityRetry(): void {
  const rt = configureCommerceObservabilityRuntime({
    retryCount: getCommerceObservabilityRuntime().retryCount + 1,
  });
  if (rt.retryCount >= 5) {
    reportLiveOperationalSignal({
      signal: "excessive_retries",
      level: "WARNING",
      detail: `retryCount=${rt.retryCount}`,
    });
  }
}

export {
  bindCommerceObservabilityScreen,
  resetCommerceScreenBinderForTests,
} from "./commerce-observability-screen-binder.js";
export { flushLiveObservabilityBuffer as flushCommerceOperationalObservability };
export { OPERATIONAL_JOURNEY_EVENTS, CRITICAL_OBSERVABILITY_SCREENS } from "./operational-journey-events.js";
export * from "./commerce-journey-wiring.js";
export { buildObservableEventEnvelope } from "./observable-event-envelope.js";
export {
  configureCommerceObservabilityRuntime,
  getCommerceObservabilityRuntime,
  readAppVersionFromEnv,
  resetCommerceObservabilityRuntimeForTests,
} from "./commerce-observability-runtime.js";
export {
  clearActiveCommerceJourney,
  getActiveCommerceJourney,
  getActiveCommerceJourneyId,
  resetCommerceJourneySessionForTests,
} from "./commerce-journey-session.js";
