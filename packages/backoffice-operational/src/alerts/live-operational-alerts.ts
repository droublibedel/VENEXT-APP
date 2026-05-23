import { getBackofficeErrorRepository } from "../repositories/backoffice-error.repository.js";
import { getBackofficeJourneyRepository } from "../repositories/backoffice-journey.repository.js";
import { getBackofficeInternalNotificationRepository } from "../repositories/backoffice-internal-notification.repository.js";
import { BackofficeOperationalEventStream } from "../stream/operational-event-stream.js";

type LiveAlertLevel = "INFO" | "WARNING" | "CRITICAL";

const counters = {
  loginFailed: 0,
  otpFailed: 0,
  onboardingAbandoned: 0,
  walletInterrupted: 0,
  catalogFailed: 0,
  messagingBlocked: 0,
  permissionsDenied: 0,
};

export async function evaluateLiveOperationalAlerts(): Promise<void> {
  const errors = (await getBackofficeErrorRepository().list({ pageSize: 200 })).items;
  const journeys = (await getBackofficeJourneyRepository().list({ pageSize: 200 })).items;
  const hour = Date.now() - 60 * 60 * 1000;

  counters.loginFailed = errors.filter(
    (e) => new Date(e.occurredAt).getTime() > hour && (e.errorType === "connection_error" || e.errorType === "password_incorrect"),
  ).length;
  counters.otpFailed = errors.filter(
    (e) => new Date(e.occurredAt).getTime() > hour && e.errorType === "otp_invalid",
  ).length;
  counters.onboardingAbandoned = journeys.filter(
    (j) => j.journeyKey === "terrain_onboarding" && j.status === "ABANDONED",
  ).length;
  counters.walletInterrupted = errors.filter(
    (e) => new Date(e.occurredAt).getTime() > hour && (e.errorType === "wallet_locked" || e.errorType === "wallet_not_activated"),
  ).length;
  counters.catalogFailed = errors.filter(
    (e) => new Date(e.occurredAt).getTime() > hour && (e.errorType === "catalog_unavailable" || e.errorType === "upload_failed"),
  ).length;
  counters.messagingBlocked = errors.filter(
    (e) => new Date(e.occurredAt).getTime() > hour && e.errorType === "message_not_sent",
  ).length;
  counters.permissionsDenied = errors.filter(
    (e) => new Date(e.occurredAt).getTime() > hour && e.errorType === "unauthorized_access",
  ).length;

  const uploadFailed = errors.filter((e) => {
    if (new Date(e.occurredAt).getTime() <= hour) return false;
    const t = String(e.errorType);
    return t === "upload_failed" || t === "image_error" || t === "invalid_file";
  }).length;
  const orderFailed = errors.filter((e) => {
    if (new Date(e.occurredAt).getTime() <= hour) return false;
    const t = String(e.errorType);
    return t === "order_unavailable" || t === "order_not_created" || t === "order_blocked";
  }).length;
  const apiUnstable = errors.filter((e) => {
    if (new Date(e.occurredAt).getTime() <= hour) return false;
    const t = String(e.errorType);
    return t === "service_unavailable" || t === "bff_error" || t === "api_unavailable";
  }).length;
  const screenRepeat = new Map<string, number>();
  for (const e of errors.filter((x) => new Date(x.occurredAt).getTime() > hour)) {
    if (!e.screen) continue;
    screenRepeat.set(e.screen, (screenRepeat.get(e.screen) ?? 0) + 1);
  }
  const hotScreen = [...screenRepeat.entries()].find(([, c]) => c >= 8);

  const alerts: { code: string; level: LiveAlertLevel; title: string }[] = [];
  if (counters.loginFailed >= 8) alerts.push({ code: "spike_login_failed", level: "CRITICAL", title: "Pic échecs connexion" });
  if (counters.otpFailed >= 6) alerts.push({ code: "spike_otp_failed", level: "CRITICAL", title: "Pic OTP invalides" });
  if (counters.onboardingAbandoned >= 5) alerts.push({ code: "spike_onboarding_abandoned", level: "WARNING", title: "Abandons onboarding" });
  if (counters.walletInterrupted >= 4) alerts.push({ code: "spike_wallet_interrupted", level: "CRITICAL", title: "Wallet interrompu" });
  if (counters.catalogFailed >= 4) alerts.push({ code: "spike_catalog_failed", level: "WARNING", title: "Échecs catalogue" });
  if (counters.messagingBlocked >= 5) alerts.push({ code: "spike_messaging_blocked", level: "WARNING", title: "Messaging bloqué" });
  if (counters.permissionsDenied >= 3) alerts.push({ code: "spike_permissions_denied", level: "INFO", title: "Permissions refusées" });
  if (uploadFailed >= 4) alerts.push({ code: "spike_upload_failed", level: "WARNING", title: "Upload média défaillant" });
  if (orderFailed >= 5) alerts.push({ code: "spike_order_failed", level: "WARNING", title: "Commandes échouées" });
  if (apiUnstable >= 6) alerts.push({ code: "api_route_unstable", level: "CRITICAL", title: "Route API instable" });
  if (hotScreen) {
    alerts.push({
      code: "screen_error_repeat",
      level: "WARNING",
      title: `Erreurs répétées — ${hotScreen[0]}`,
    });
  }

  const notifications = getBackofficeInternalNotificationRepository();
  const stream = BackofficeOperationalEventStream.shared();
  for (const a of alerts) {
    await notifications.push({
      priority: a.level === "CRITICAL" ? "critical" : a.level === "WARNING" ? "high" : "normal",
      title: a.title,
      body: a.code,
      linkedType: "live_alert",
      linkedId: a.code,
    });
    await stream.append({
      kind: "HEALTH_EVENT",
      title: a.title,
      payload: { code: a.code, level: a.level, counters },
    });
  }
}
