import type { BackofficeJourneyInstance } from "../types/journey.types.js";
import { getJourneyDefinition, expectedNextStep } from "./journey-definitions.js";

export type BrokenJourneyPattern =
  | "stuck_journey"
  | "abandoned_journey"
  | "impossible_transition"
  | "repeated_failure"
  | "retry_loop"
  | "onboarding_incomplete"
  | "invitation_unused"
  | "wallet_never_activated"
  | "catalog_never_published";

export type BrokenJourneyAlert = {
  journeyId: string;
  journeyKey: string;
  pattern: BrokenJourneyPattern;
  message: string;
  severity: "warning" | "high";
};

const STUCK_MS = 30 * 60 * 1000;
const ABANDON_MS = 24 * 60 * 60 * 1000;

export function detectBrokenJourneyPatterns(journeys: BackofficeJourneyInstance[]): BrokenJourneyAlert[] {
  const alerts: BrokenJourneyAlert[] = [];
  const now = Date.now();

  for (const j of journeys) {
    const lastAt = new Date(j.lastStepAt).getTime();
    const def = getJourneyDefinition(j.journeyKey);

    if (j.status === "IN_PROGRESS" || j.status === "STARTED") {
      if (now - lastAt > STUCK_MS) {
        alerts.push({
          journeyId: j.journeyId,
          journeyKey: j.journeyKey,
          pattern: "stuck_journey",
          message: `Bloqué à l'étape ${j.currentStep}`,
          severity: "high",
        });
      }
      if (now - lastAt > ABANDON_MS) {
        alerts.push({
          journeyId: j.journeyId,
          journeyKey: j.journeyKey,
          pattern: "abandoned_journey",
          message: "Parcours abandonné (timeout)",
          severity: "warning",
        });
      }
    }

    if (j.status === "ABANDONED") {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "abandoned_journey",
        message: "Abandon explicite",
        severity: "warning",
      });
    }

    if ((j.retryCount ?? 0) >= 3) {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "retry_loop",
        message: `${j.retryCount} tentatives`,
        severity: "high",
      });
    }

    if (j.status === "FAILED" || j.status === "BLOCKED") {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "repeated_failure",
        message: j.failureReason ?? j.status,
        severity: "high",
      });
    }

    const next = expectedNextStep(j.journeyKey, j.currentStep);
    if (def && j.expectedNextStep && next && j.expectedNextStep !== next && j.status === "IN_PROGRESS") {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "impossible_transition",
        message: `Transition attendue ${next}, vu ${j.expectedNextStep}`,
        severity: "warning",
      });
    }

    if (
      j.journeyKey === "terrain_onboarding" &&
      j.status !== "COMPLETED" &&
      j.currentStep !== "completed" &&
      now - lastAt > STUCK_MS
    ) {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "onboarding_incomplete",
        message: "Inscription terrain incomplète",
        severity: "warning",
      });
    }

    if (j.journeyKey === "enterprise_invitation" && j.status === "BLOCKED") {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "invitation_unused",
        message: "Invitation entreprise non finalisée",
        severity: "warning",
      });
    }

    if (j.journeyKey === "wallet_activation" && j.status !== "COMPLETED") {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "wallet_never_activated",
        message: "Wallet non activé",
        severity: "high",
      });
    }

    if (j.journeyKey === "create_product" && j.status === "ABANDONED") {
      alerts.push({
        journeyId: j.journeyId,
        journeyKey: j.journeyKey,
        pattern: "catalog_never_published",
        message: "Produit jamais publié",
        severity: "warning",
      });
    }
  }

  return alerts;
}
