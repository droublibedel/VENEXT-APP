import { isBackofficeFlagEnabled } from "../flags/backoffice-feature-flags.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { getBackofficeSupportRepository } from "../repositories/backoffice-support.repository.js";
import type { BackofficeErrorEvent } from "../types/error.types.js";
import type { BackofficeJourneyInstance } from "../types/journey.types.js";
import type { SupportPriority } from "../types/support.types.js";
import { generateSupportSuggestion } from "./support-suggestions.js";

function env(): "development" | "production" {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function priorityForError(e: BackofficeErrorEvent): SupportPriority {
  if (e.errorType === "wallet_locked" && e.commercialContext?.walletBalance) {
    return "URGENT";
  }
  if (e.severity === "critical") return "URGENT";
  if (e.errorType === "access_suspended") return "IMPORTANT";
  return "NORMAL";
}

function priorityForJourney(j: BackofficeJourneyInstance): SupportPriority {
  if (j.journeyKey === "settlement" || j.journeyKey === "wallet_activation") return "URGENT";
  if (j.status === "BLOCKED") return "IMPORTANT";
  return "NORMAL";
}

export async function maybeAutoSupportFromError(event: BackofficeErrorEvent): Promise<void> {
  if (!isBackofficeFlagEnabled("backoffice_support_desk_enabled", env())) return;
  const store = getBackofficeStore();
  const exists = store.support.some((t) => t.linkedErrorEventId === event.id && t.status !== "ARCHIVED");
  if (exists) return;

  const { labelFr } = generateSupportSuggestion({ error: event });
  await getBackofficeSupportRepository().create({
    priority: priorityForError(event),
    source: "AUTO_ERROR",
    status: "OPEN",
    title: `Erreur ${event.errorType}`,
    summary: event.userFacingMessage,
    userId: event.userId,
    userPhone: event.userPhone,
    linkedErrorEventId: event.id,
    suggestion: labelFr,
  });
}

export async function maybeAutoSupportFromJourney(journey: BackofficeJourneyInstance): Promise<void> {
  if (!isBackofficeFlagEnabled("backoffice_support_desk_enabled", env())) return;
  if (journey.status !== "BLOCKED" && journey.status !== "FAILED" && journey.status !== "ABANDONED") return;
  const store = getBackofficeStore();
  const exists = store.support.some((t) => t.linkedJourneyId === journey.journeyId && t.status !== "ARCHIVED");
  if (exists) return;

  const { labelFr } = generateSupportSuggestion({ journey });
  await getBackofficeSupportRepository().create({
    priority: priorityForJourney(journey),
    source: "AUTO_JOURNEY",
    status: "OPEN",
    title: `Parcours ${journey.journeyKey} — ${journey.status}`,
    summary: `Bloqué à l'étape ${journey.currentStep}`,
    userId: journey.userId,
    userPhone: journey.userPhone,
    linkedJourneyId: journey.journeyId,
    suggestion: labelFr,
  });
}
