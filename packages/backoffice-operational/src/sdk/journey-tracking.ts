import { expectedNextStep, getJourneyDefinition } from "../journeys/journey-definitions.js";
import { isBackofficeFlagEnabled } from "../flags/backoffice-feature-flags.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { getBackofficeJourneyRepository } from "../repositories/backoffice-journey.repository.js";
import { BackofficeOperationalEventStream } from "../stream/operational-event-stream.js";
import type { BackofficeJourneyInstance, JourneyFailureReason, JourneyStatus } from "../types/journey.types.js";
import { BackofficeEventCollector } from "../collector/backoffice-event-collector.js";
import { maybeAutoSupportFromJourney } from "../support/support-auto.js";

export type JourneyTrackContext = {
  journeyKey: string;
  actorId: string;
  actorRole: string;
  application: string;
  userId?: string;
  userPhone?: string;
  userEmail?: string;
};

function env(): "development" | "production" {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function enabled(): boolean {
  return isBackofficeFlagEnabled("backoffice_journey_monitoring_enabled", env());
}

function persistJourney(j: BackofficeJourneyInstance): void {
  void getBackofficeJourneyRepository().upsert(j);
  void BackofficeOperationalEventStream.shared().append({
    kind: "JOURNEY_EVENT",
    title: `${j.journeyKey} — ${j.status}`,
    payload: { journeyId: j.journeyId, step: j.currentStep },
    application: j.application,
    userId: j.userId,
  });
}

export function trackJourneyStart(ctx: JourneyTrackContext): BackofficeJourneyInstance | null {
  if (!enabled()) return null;
  const def = getJourneyDefinition(ctx.journeyKey);
  const first = def?.steps.sort((a, b) => a.order - b.order)[0]?.stepKey ?? "started";
  const ts = new Date().toISOString();
  const row: BackofficeJourneyInstance = {
    journeyId: crypto.randomUUID(),
    journeyKey: ctx.journeyKey,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    application: ctx.application,
    startedAt: ts,
    lastStepAt: ts,
    currentStep: first,
    expectedNextStep: expectedNextStep(ctx.journeyKey, first),
    status: "STARTED",
    userId: ctx.userId,
    userPhone: ctx.userPhone,
    userEmail: ctx.userEmail,
    retryCount: 0,
  };
  getBackofficeStore().addJourney(row);
  getBackofficeStore().addJourneyEvent({
    journeyId: row.journeyId,
    journeyKey: ctx.journeyKey,
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    application: ctx.application,
    stepKey: first,
  });
  persistJourney(row);
  BackofficeEventCollector.shared().emitJourney(row);
  return row;
}

export function trackJourneyStep(journeyId: string, stepKey: string): BackofficeJourneyInstance | null {
  if (!enabled()) return null;
  const store = getBackofficeStore();
  const row = store.findJourney(journeyId);
  if (!row) return null;
  const ts = new Date().toISOString();
  store.updateJourney(journeyId, {
    lastStepAt: ts,
    currentStep: stepKey,
    expectedNextStep: expectedNextStep(row.journeyKey, stepKey),
    status: "IN_PROGRESS" as JourneyStatus,
    retryCount: (row.retryCount ?? 0) + 1,
  });
  const updated = store.findJourney(journeyId);
  if (updated) persistJourney(updated);
  return updated ?? null;
}

export function trackJourneyComplete(journeyId: string, finalStep = "completed"): BackofficeJourneyInstance | null {
  if (!enabled()) return null;
  trackJourneyStep(journeyId, finalStep);
  const ts = new Date().toISOString();
  getBackofficeStore().updateJourney(journeyId, {
    status: "COMPLETED",
    completedAt: ts,
    lastStepAt: ts,
    currentStep: finalStep,
    expectedNextStep: undefined,
  });
  const row = getBackofficeStore().findJourney(journeyId);
  if (row) {
    persistJourney(row);
    BackofficeEventCollector.shared().emitJourney(row);
  }
  return row ?? null;
}

export function trackJourneyFail(
  journeyId: string,
  reason: JourneyFailureReason,
  linkedErrorEventId?: string,
): BackofficeJourneyInstance | null {
  if (!enabled()) return null;
  const ts = new Date().toISOString();
  getBackofficeStore().updateJourney(journeyId, {
    status: "FAILED",
    failureReason: reason,
    linkedErrorEventId,
    lastStepAt: ts,
  });
  const row = getBackofficeStore().findJourney(journeyId);
  if (row) {
    persistJourney(row);
    BackofficeEventCollector.shared().emitJourney(row);
    void maybeAutoSupportFromJourney(row);
  }
  return row ?? null;
}

export function trackJourneyAbandon(
  journeyId: string,
  reason: JourneyFailureReason = "USER_LEFT",
): BackofficeJourneyInstance | null {
  if (!enabled()) return null;
  const ts = new Date().toISOString();
  getBackofficeStore().updateJourney(journeyId, {
    status: "ABANDONED",
    failureReason: reason,
    lastStepAt: ts,
  });
  const row = getBackofficeStore().findJourney(journeyId);
  if (row) {
    persistJourney(row);
    BackofficeEventCollector.shared().emitJourney(row);
    void maybeAutoSupportFromJourney(row);
  }
  return row ?? null;
}

export function markJourneyBlocked(
  journeyId: string,
  reason: JourneyFailureReason,
  linkedErrorEventId?: string,
): BackofficeJourneyInstance | null {
  if (!enabled()) return null;
  const ts = new Date().toISOString();
  getBackofficeStore().updateJourney(journeyId, {
    status: "BLOCKED",
    failureReason: reason,
    linkedErrorEventId,
    lastStepAt: ts,
  });
  const row = getBackofficeStore().findJourney(journeyId);
  if (row) {
    persistJourney(row);
    BackofficeEventCollector.shared().emitJourney(row);
    void maybeAutoSupportFromJourney(row);
    getBackofficeStore().pushNotification("high", `Parcours bloqué : ${row.journeyKey}`);
  }
  return row ?? null;
}
