import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

import type {
  CommerceNotification,
  CommerceNotificationEventType,
} from "./commerce-notifications.types";
import { getNotificationTranslation } from "./commerce-notifications-i18n";

const ERP_FORBIDDEN = /\b(erp|crm|kpi|dashboard|pipeline|workflow|sla|oauth|api)\b/i;
const SOCIAL_FORBIDDEN = /\b(like|follow|reaction|viral|story|feed public)\b/i;
const FINTECH_JARGON = /\b(swift|iban|sepa|liquidity pool)\b/i;

export function sanitizeNotificationText(text: string): string {
  let out = sanitizeCommerceFoundationText(text);
  if (ERP_FORBIDDEN.test(out) || SOCIAL_FORBIDDEN.test(out) || FINTECH_JARGON.test(out)) {
    out = out.replace(ERP_FORBIDDEN, "").replace(SOCIAL_FORBIDDEN, "").replace(FINTECH_JARGON, "");
    out = out.trim() || "Activité commerciale";
  }
  return out;
}

export function buildNotificationLabel(
  notification: CommerceNotification,
  locale = "fr-CI",
): string {
  const raw = getNotificationTranslation(notification.titleKey, locale);
  return sanitizeNotificationText(raw);
}

export function buildNotificationHint(
  notification: CommerceNotification,
  locale = "fr-CI",
): string {
  const key = notification.bodyKey ?? `notifications.hints.${notification.eventType}`;
  return sanitizeNotificationText(getNotificationTranslation(key, locale));
}

export type CommerceNotificationAction = {
  label: string;
  transition?: string;
  module?: string;
};

export function buildNotificationAction(
  notification: CommerceNotification,
  locale = "fr-CI",
): CommerceNotificationAction | null {
  if (!notification.contextLink) return null;
  const module = notification.contextLink.module;
  const labels: Partial<Record<CommerceNotificationEventType, string>> = {
    ORDER_VALIDATED: "notifications.actions.viewOrder",
    DELIVERY_NEAR: "notifications.actions.viewDelivery",
    SETTLEMENT_PENDING: "notifications.actions.viewSettlement",
    MESSAGE_RECEIVED: "notifications.actions.openConversation",
    MAIL_RECEIVED: "notifications.actions.openMail",
    CATALOG_AVAILABLE: "notifications.actions.viewCatalog",
    WALLET_LOCKED: "notifications.actions.openWallet",
  };
  const key = labels[notification.eventType] ?? "notifications.actions.open";
  return {
    label: sanitizeNotificationText(getNotificationTranslation(key, locale)),
    module,
    transition: "context-back",
  };
}
