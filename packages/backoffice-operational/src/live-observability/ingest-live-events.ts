import { evaluateAutomaticAlerts } from "../alerts/automatic-alerts.js";
import { createBackofficeErrorEvent } from "../errors/error-pipeline.js";
import { attachJourneyContextToError } from "../journeys/attach-journey-context.js";
import { getBackofficeJourneyRepository } from "../repositories/backoffice-journey.repository.js";
import { getBackofficeInternalNotificationRepository } from "../repositories/backoffice-internal-notification.repository.js";
import { getBackofficeObservabilityRepository } from "../repositories/backoffice-observability.repository.js";
import { evaluateLiveOperationalAlerts } from "../alerts/live-operational-alerts.js";
import { canonicalJourneyKeyForLiveEvent } from "./journey-live-map.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import type { BackofficeErrorType } from "../types/error.types.js";
import type { BackofficeJourneyInstance } from "../types/journey.types.js";

const rateLimit = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;

function allow(app: string): boolean {
  const now = Date.now();
  const key = app || "unknown";
  const arr = (rateLimit.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    rateLimit.set(key, arr);
    return false;
  }
  arr.push(now);
  rateLimit.set(key, arr);
  return true;
}

export async function ingestLiveErrorEvents(events: Record<string, unknown>[]): Promise<number> {
  let n = 0;
  for (const e of events) {
    const app = String(e.app ?? "unknown");
    if (!allow(app)) continue;
    let row = await createBackofficeErrorEvent({
      userFacingMessage: String(e.userFacingMessage ?? e.errorType ?? "Erreur"),
      technicalMessage: String(e.technicalMessage ?? "live_error"),
      errorType: (String(e.errorType ?? "generic") as BackofficeErrorType) || "generic",
      severity: (e.severity as "info" | "error" | "critical") ?? "error",
      application: app,
      screen: e.screen ? String(e.screen) : undefined,
      action: e.action ? String(e.action) : undefined,
      routeOrApi: e.routeOrApi ? String(e.routeOrApi) : undefined,
      module: e.module ? String(e.module) : undefined,
      userId: e.userId ? String(e.userId) : undefined,
      userPhone: e.userPhone ? String(e.userPhone) : undefined,
      actorRole: e.actorRole ? String(e.actorRole) : undefined,
      commercialContext: {
        enterpriseId: e.enterpriseId,
        relationshipId: e.relationshipId,
        networkState: e.networkState,
        offlineState: e.offlineState,
        feature: e.feature,
        pole: e.pole,
        appVersion: e.appVersion,
        buildNumber: e.buildNumber,
        releaseChannel: e.releaseChannel,
        networkQuality: e.networkQuality,
        deviceClass: e.deviceClass,
        journeyStep: (e.commercialContext as Record<string, unknown> | undefined)?.journeyStep,
        journeyKey: (e.commercialContext as Record<string, unknown> | undefined)?.journeyKey,
      },
      journeyId: e.journeyId ? String(e.journeyId) : undefined,
    });
    if (row && e.journeyId) {
      row = await attachJourneyContextToError(row, String(e.journeyId));
    }
    await getBackofficeObservabilityRepository().recordAppSnapshot({
      application: app as never,
      version: e.appVersion ? String(e.appVersion) : undefined,
      build: e.buildNumber ? String(e.buildNumber) : undefined,
      activeUsers: getBackofficeStore().users.filter((u) => u.sessionActive).length,
      errorCount24h: getBackofficeStore().errors.filter((x) => x.application === app).length,
      blockedJourneys24h: getBackofficeStore().journeys.filter(
        (j) => j.application === app && (j.status === "BLOCKED" || j.status === "FAILED"),
      ).length,
    });
    n += 1;
  }
  if (n > 0) {
    await evaluateLiveOperationalAlerts();
    const store = getBackofficeStore();
    await evaluateAutomaticAlerts({
      errors: store.errors.slice(-200),
      journeys: store.journeys.slice(-200),
    });
  }
  return n;
}

export async function ingestLiveJourneyEvents(events: Record<string, unknown>[]): Promise<number> {
  const repo = getBackofficeJourneyRepository();
  let n = 0;
  for (const e of events) {
    const app = String(e.app ?? "unknown");
    if (!allow(app)) continue;
    const journeyKey = canonicalJourneyKeyForLiveEvent(String(e.journeyKey ?? e.eventKey ?? "login"));
    const status = String(e.status ?? "IN_PROGRESS") as BackofficeJourneyInstance["status"];
    const now = new Date().toISOString();
    const journeyId = String(e.journeyId ?? `live-${journeyKey}-${String(e.actorId ?? e.userId ?? "anon")}`);
    await repo.upsert({
      journeyId,
      journeyKey,
      actorId: String(e.actorId ?? e.userId ?? "live-anon"),
      actorRole: String(e.actorRole ?? "UNKNOWN"),
      application: app,
      startedAt: String(e.startedAt ?? now),
      lastStepAt: now,
      currentStep: String(e.step ?? e.eventKey ?? "unknown"),
      status,
      failureReason: e.failureReason
        ? (String(e.failureReason) as BackofficeJourneyInstance["failureReason"])
        : undefined,
      userId: e.userId ? String(e.userId) : undefined,
      userPhone: e.userPhone ? String(e.userPhone) : undefined,
    });
    n += 1;
  }
  if (n > 0) await evaluateLiveOperationalAlerts();
  return n;
}

export async function ingestLiveOperationalEvents(events: Record<string, unknown>[]): Promise<number> {
  const notifications = getBackofficeInternalNotificationRepository();
  let n = 0;
  for (const e of events) {
    if (!allow(String(e.app ?? "unknown"))) continue;
    const level = String(e.level ?? "INFO");
    if (level === "CRITICAL" || level === "WARNING") {
      await notifications.push({
        priority: level === "CRITICAL" ? "critical" : "high",
        title: String(e.signal ?? "operational"),
        body: String(e.detail ?? ""),
        linkedType: "live_signal",
      });
    }
    n += 1;
  }
  return n;
}

export async function ingestLiveBlockageEvents(events: Record<string, unknown>[]): Promise<number> {
  const notifications = getBackofficeInternalNotificationRepository();
  let n = 0;
  for (const e of events) {
    if (!allow(String(e.app ?? "unknown"))) continue;
    await notifications.push({
      priority: String(e.severity) === "CRITICAL" ? "critical" : "high",
      title: `Blocage ${e.code}`,
      body: String(e.screen ?? ""),
      linkedType: "blockage",
    });
    n += 1;
  }
  if (n > 0) await evaluateLiveOperationalAlerts();
  return n;
}

export function resetLiveIngestRateLimitForTests(): void {
  rateLimit.clear();
}
