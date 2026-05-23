import type { CommerceErrorKey } from "commerce-humanized-errors/dist/commerce-humanized-errors.types.js";
import { registerBackofficeHumanizedErrorReporter } from "commerce-humanized-errors/dist/backoffice-reporter-hook.js";

import { pushLiveBufferedEvent } from "./backoffice-live-observability-buffer.js";
import {
  configureLiveObservabilityContext,
  resolveLiveOperationalContext,
  type LiveObservabilityApplication,
} from "./backoffice-live-observability-context.js";
import { liveEventFingerprint, shouldDedupeLiveEvent } from "./backoffice-live-observability-dedupe.js";
import { scheduleLiveObservabilityFlush, installLiveObservabilityFlushHooks, flushLiveObservabilityBuffer } from "./backoffice-live-observability-flush.js";
import { sanitizeLivePayload, sanitizeTechnicalMessage } from "./backoffice-live-observability-sanitizer.js";
import { configureLiveObservabilityTransport, isLiveTransportEnabled } from "./backoffice-live-observability-transport.js";
import { canonicalJourneyKeyForLiveEvent, journeyStatusFromLiveEvent } from "./journey-live-map.js";
import { reportLiveUserBlockage } from "./blockage-detector.js";
import { getActiveCommerceJourneyId } from "../sdk/commerce-journey-session.js";

const activeJourneys = new Map<string, { journeyKey: string; step: string; startedAt: string }>();

let initialized = false;

export type InitLiveBackofficeObservabilityInput = {
  application: LiveObservabilityApplication;
  bffBaseUrl?: string;
  telemetryKey?: string;
  enabled?: boolean;
  getContext?: () => Record<string, unknown>;
};

export function initLiveBackofficeObservability(input: InitLiveBackofficeObservabilityInput): void {
  configureLiveObservabilityContext({
    application: input.application,
    getContext: () => (input.getContext?.() ?? {}) as never,
  });
  configureLiveObservabilityTransport({
    baseUrl: input.bffBaseUrl ?? "",
    telemetryKey: input.telemetryKey,
    enabled: input.enabled !== false,
  });
  if (!initialized) {
    initialized = true;
    installLiveObservabilityFlushHooks();
    registerBackofficeHumanizedErrorReporter((payload) => {
      void reportLiveBackofficeError({
        commerceErrorKey: payload.commerceErrorKey,
        technicalMessage: payload.technicalMessage,
        internalStack: payload.internalStack,
        screen: payload.screen,
        action: payload.action,
        routeOrApi: payload.routeOrApi,
        module: payload.module,
        userId: payload.userId,
        userPhone: payload.userPhone,
        userEmail: payload.userEmail,
        actorRole: payload.actorRole,
        application: payload.application as LiveObservabilityApplication,
      });
    });
  }
}

function enqueue(
  kind: "error" | "journey" | "operational",
  priority: number,
  payload: Record<string, unknown>,
): void {
  const fp = liveEventFingerprint([kind, String(payload.eventKey ?? payload.errorType ?? ""), String(payload.screen ?? "")]);
  if (shouldDedupeLiveEvent(fp)) return;
  pushLiveBufferedEvent({ kind, priority, payload: sanitizeLivePayload(payload) });
  scheduleLiveObservabilityFlush();
}

export function reportLiveBackofficeError(input: {
  commerceErrorKey: CommerceErrorKey | string;
  technicalMessage: string;
  internalStack?: string;
  application: LiveObservabilityApplication;
  screen?: string;
  action?: string;
  routeOrApi?: string;
  module?: string;
  userId?: string;
  userPhone?: string;
  userEmail?: string;
  actorRole?: string;
  severity?: string;
}): void {
  if (!isLiveTransportEnabled()) return;
  const ctx = resolveLiveOperationalContext({
    app: input.application,
    screen: input.screen,
    module: input.module,
    userId: input.userId,
    userPhone: input.userPhone,
    actorId: input.userId,
    actorRole: input.actorRole,
    action: input.action,
    journeyId: getActiveCommerceJourneyId(),
  });
  enqueue("error", input.commerceErrorKey === "otp_invalid" ? 90 : 60, {
    ...ctx,
    errorType: String(input.commerceErrorKey),
    technicalMessage: sanitizeTechnicalMessage(input.technicalMessage),
    userFacingMessage: input.commerceErrorKey,
    severity: input.severity ?? "error",
    action: input.action,
    routeOrApi: input.routeOrApi,
  });
  reportLiveUserBlockage({
    screen: input.screen ?? "unknown",
    signal: "error_repeat",
    errorType: String(input.commerceErrorKey),
  });
}

export function reportLiveJourneyEvent(input: {
  eventKey: string;
  step?: string;
  status?: string;
  failureReason?: string;
  partial?: Record<string, unknown>;
}): void {
  if (!isLiveTransportEnabled()) return;
  const ctx = resolveLiveOperationalContext(input.partial as never);
  const journeyKey = canonicalJourneyKeyForLiveEvent(input.eventKey);
  enqueue("journey", 50, {
    ...ctx,
    eventKey: input.eventKey,
    journeyKey,
    step: input.step ?? input.eventKey,
    status: input.status ?? journeyStatusFromLiveEvent(input.eventKey),
    failureReason: input.failureReason,
  });
}

export function reportLiveOperationalSignal(input: {
  signal: string;
  level?: "INFO" | "WARNING" | "CRITICAL";
  detail?: string;
  partial?: Record<string, unknown>;
}): void {
  if (!isLiveTransportEnabled()) return;
  const ctx = resolveLiveOperationalContext(input.partial as never);
  const priority = input.level === "CRITICAL" ? 95 : input.level === "WARNING" ? 55 : 20;
  enqueue("operational", priority, { ...ctx, signal: input.signal, level: input.level ?? "INFO", detail: input.detail });
}

export function reportLiveRecoverableFailure(input: {
  feature: string;
  reason: string;
  partial?: Record<string, unknown>;
}): void {
  reportLiveOperationalSignal({
    signal: "recoverable_failure",
    level: "WARNING",
    detail: `${input.feature}:${input.reason}`,
    partial: input.partial,
  });
}

export function trackLiveJourneyStart(eventKey: string, partial?: Record<string, unknown>): string {
  const journeyId = `lj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  activeJourneys.set(journeyId, {
    journeyKey: canonicalJourneyKeyForLiveEvent(eventKey),
    step: eventKey,
    startedAt: new Date().toISOString(),
  });
  reportLiveJourneyEvent({ eventKey: `${eventKey.replace(/_started$/, "")}_started`, step: eventKey, partial });
  return journeyId;
}

export function trackLiveJourneyStep(journeyId: string, step: string, partial?: Record<string, unknown>): void {
  const j = activeJourneys.get(journeyId);
  if (j) j.step = step;
  reportLiveJourneyEvent({
    eventKey: step,
    step,
    status: "IN_PROGRESS",
    partial: { ...partial, journeyId },
  });
}

export function trackLiveJourneySuccess(journeyId: string, eventKey: string, partial?: Record<string, unknown>): void {
  reportLiveJourneyEvent({
    eventKey: eventKey.endsWith("_completed") || eventKey.endsWith("_success") ? eventKey : `${eventKey}_completed`,
    status: "COMPLETED",
    partial: { ...partial, journeyId },
  });
  activeJourneys.delete(journeyId);
  void flushLiveObservabilityBuffer();
}

export function trackLiveJourneyFailure(
  journeyId: string,
  eventKey: string,
  reason: string,
  partial?: Record<string, unknown>,
): void {
  reportLiveJourneyEvent({
    eventKey: eventKey.endsWith("_failed") || eventKey.endsWith("_failure") ? eventKey : `${eventKey}_failed`,
    status: "BLOCKED",
    failureReason: reason,
    partial: { ...partial, journeyId },
  });
  reportLiveUserBlockage({ screen: String(partial?.screen ?? "journey"), signal: "retry_loop", journeyKey: eventKey });
  activeJourneys.delete(journeyId);
}

export function trackLiveJourneyAbandon(journeyId: string, reason = "USER_LEFT", partial?: Record<string, unknown>): void {
  reportLiveJourneyEvent({
    eventKey: "journey_abandoned",
    status: "ABANDONED",
    failureReason: reason,
    partial: { ...partial, journeyId },
  });
  activeJourneys.delete(journeyId);
}

export { reportLiveUserBlockage, flushLiveObservabilityBuffer };
