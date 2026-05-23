import type { BackofficeErrorEvent } from "../types/error.types.js";
import type { BackofficeJourneyInstance } from "../types/journey.types.js";
import { detectBrokenJourneyPatterns } from "../journeys/broken-journey-detector.js";
import { getBackofficeInternalNotificationRepository } from "../repositories/backoffice-internal-notification.repository.js";
import { BackofficeOperationalEventStream } from "../stream/operational-event-stream.js";

export type AutomaticAlert = {
  code: string;
  title: string;
  priority: "low" | "normal" | "high" | "critical";
};

export async function evaluateAutomaticAlerts(input: {
  errors: BackofficeErrorEvent[];
  journeys: BackofficeJourneyInstance[];
  fallbackRate?: number;
}): Promise<AutomaticAlert[]> {
  const alerts: AutomaticAlert[] = [];
  const lastHour = Date.now() - 60 * 60 * 1000;
  const recent = input.errors.filter((e) => new Date(e.occurredAt).getTime() > lastHour);

  const loginErrors = recent.filter((e) => e.errorType === "connection_error").length;
  const otpErrors = recent.filter((e) => e.errorType === "otp_invalid").length;
  if (loginErrors >= 10) {
    alerts.push({ code: "login_error_spike", title: "Explosion erreurs connexion", priority: "critical" });
  }
  if (otpErrors >= 8) {
    alerts.push({ code: "otp_invalid_spike", title: "Explosion OTP invalides", priority: "high" });
  }

  const broken = detectBrokenJourneyPatterns(input.journeys);
  if (broken.length >= 5) {
    alerts.push({ code: "broken_journey_spike", title: "Hausse parcours cassés", priority: "high" });
  }

  const walletFails = recent.filter((e) => e.errorType === "wallet_locked").length;
  if (walletFails >= 3) {
    alerts.push({ code: "wallet_failure_spike", title: "Échecs wallet anormaux", priority: "critical" });
  }

  if ((input.fallbackRate ?? 0) > 0.25) {
    alerts.push({ code: "excessive_fallback", title: "Fallback excessif", priority: "high" });
  }

  const notifications = getBackofficeInternalNotificationRepository();
  const stream = BackofficeOperationalEventStream.shared();

  for (const a of alerts) {
    await notifications.push({
      priority: a.priority,
      title: a.title,
      linkedType: "alert",
      linkedId: a.code,
    });
    await stream.append({
      kind: "HEALTH_EVENT",
      title: a.title,
      payload: { code: a.code, priority: a.priority },
    });
  }

  return alerts;
}
