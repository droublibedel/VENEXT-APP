import type { CommerceErrorKey } from "commerce-humanized-errors/dist/commerce-humanized-errors.types.js";
import { humanizeByKey } from "commerce-humanized-errors/dist/commerce-humanized-errors.js";

import type { BackofficeErrorEvent, BackofficeErrorType } from "../types/error.types.js";
import { BackofficeEventCollector } from "../collector/backoffice-event-collector.js";
import { getBackofficeErrorRepository } from "../repositories/backoffice-error.repository.js";
import { BackofficeOperationalEventStream } from "../stream/operational-event-stream.js";
import { attachJourneyContextToError } from "../journeys/attach-journey-context.js";
import { maybeAutoSupportFromError } from "../support/support-auto.js";

const KEY_TO_TYPE: Partial<Record<CommerceErrorKey, BackofficeErrorType>> = {
  network_unstable: "network_unstable",
  connection_timeout: "connection_error",
  session_expired: "session_expired",
  access_suspended: "access_suspended",
  access_denied: "unauthorized_access",
  wallet_locked: "wallet_locked",
  otp_invalid: "otp_invalid",
  password_incorrect: "password_incorrect",
  service_unavailable: "api_unavailable",
  catalog_unavailable: "catalog_unavailable",
  message_not_sent: "message_not_sent",
  delivery_unavailable: "delivery_not_confirmed",
  invalid_file: "invalid_file",
  sync_failed: "offline_sync_error",
  server_error: "backend_error",
  runtime_error: "frontend_runtime",
  order_unavailable: "order_not_created",
  wallet_action_failed: "settlement_failed",
  unexpected: "generic",
  offline: "network_unstable",
};

export type ReportUserFacingErrorInput = {
  commerceErrorKey: CommerceErrorKey;
  technicalMessage: string;
  internalStack?: string;
  userId?: string;
  userPhone?: string;
  userEmail?: string;
  actorId?: string;
  actorRole?: string;
  application: string;
  screen?: string;
  action?: string;
  routeOrApi?: string;
  module?: string;
  device?: string;
  userAgent?: string;
  networkHint?: string;
  commercialContext?: Record<string, unknown>;
  locale?: string;
  journeyId?: string;
};

export function mapCommerceKeyToBackofficeType(key: CommerceErrorKey): BackofficeErrorType {
  return KEY_TO_TYPE[key] ?? "generic";
}

export async function createBackofficeErrorEvent(
  input: Omit<BackofficeErrorEvent, "id" | "occurredAt" | "treatmentStatus"> & {
    id?: string;
    occurredAt?: string;
    treatmentStatus?: BackofficeErrorEvent["treatmentStatus"];
  },
): Promise<BackofficeErrorEvent> {
  let event = await getBackofficeErrorRepository().create(input);
  event = await attachJourneyContextToError(event, input.journeyId);
  await BackofficeOperationalEventStream.shared().append({
    kind: "ERROR_EVENT",
    title: event.errorType,
    payload: { id: event.id, application: event.application },
    application: event.application,
    userId: event.userId,
  });
  await maybeAutoSupportFromError(event);
  return event;
}

export async function captureTechnicalErrorForBackoffice(
  input: ReportUserFacingErrorInput & { severity?: BackofficeErrorEvent["severity"] },
): Promise<BackofficeErrorEvent> {
  const human = humanizeByKey(input.commerceErrorKey, input.locale ?? "fr-CI");
  return createBackofficeErrorEvent({
    userFacingMessage: human.message,
    technicalMessage: input.technicalMessage,
    internalStack: input.internalStack,
    errorType: mapCommerceKeyToBackofficeType(input.commerceErrorKey),
    severity: input.severity ?? (human.severity === "blocking" ? "critical" : "error"),
    userId: input.userId,
    userPhone: input.userPhone,
    userEmail: input.userEmail,
    actorId: input.actorId,
    actorRole: input.actorRole,
    application: input.application,
    screen: input.screen,
    action: input.action,
    routeOrApi: input.routeOrApi,
    module: input.module,
    device: input.device,
    userAgent: input.userAgent,
    networkHint: input.networkHint,
    commercialContext: input.commercialContext,
    journeyId: input.journeyId,
  });
}

export async function reportUserFacingError(input: ReportUserFacingErrorInput): Promise<BackofficeErrorEvent> {
  const event = await captureTechnicalErrorForBackoffice(input);
  BackofficeEventCollector.shared().emitError(event);
  return event;
}

