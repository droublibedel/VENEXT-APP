import { buildAccessContext, withNotificationsAccess } from "commerce-access-control";

import type {
  CommerceActorRole,
  CommerceNotification,
  CommerceNotificationEventType,
  CommerceNotificationPreferences,
} from "./commerce-notifications.types";
import { categoryForEventType } from "./commerce-notifications-events";

const PRODUCER_ALLOWED: CommerceNotificationEventType[] = [
  "MAIL_RECEIVED",
  "ORDER_CREATED",
  "ORDER_VALIDATED",
  "ORDER_UPDATED",
  "SETTLEMENT_RECEIVED",
  "SETTLEMENT_PENDING",
  "DELIVERY_STARTED",
  "DELIVERY_CONFIRMED",
  "RELATION_REQUEST",
  "RELATION_ACCEPTED",
  "CATALOG_AVAILABLE",
  "CONTEXT_RETURN_AVAILABLE",
];

const GROSSISTE_A_ALLOWED: CommerceNotificationEventType[] = [
  "ORDER_CREATED",
  "ORDER_VALIDATED",
  "ORDER_UPDATED",
  "DELIVERY_STARTED",
  "DELIVERY_NEAR",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "SETTLEMENT_PENDING",
  "MESSAGE_RECEIVED",
  "MAIL_RECEIVED",
  "RELATION_ACCEPTED",
  "CATALOG_AVAILABLE",
  "SPONSORED_CATALOG_AVAILABLE",
];

const GROSSISTE_B_ALLOWED: CommerceNotificationEventType[] = [
  "ORDER_CREATED",
  "ORDER_VALIDATED",
  "ORDER_UPDATED",
  "DELIVERY_STARTED",
  "DELIVERY_NEAR",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "SETTLEMENT_PENDING",
  "MESSAGE_RECEIVED",
  "RELATION_REQUEST",
  "RELATION_ACCEPTED",
  "CATALOG_AVAILABLE",
  "WALLET_SECURED",
  "WALLET_LOCKED",
];

const DETAILLANT_ALLOWED: CommerceNotificationEventType[] = [
  "ORDER_CREATED",
  "ORDER_VALIDATED",
  "DELIVERY_NEAR",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_PENDING",
  "SETTLEMENT_RECEIVED",
  "MESSAGE_RECEIVED",
  "CATALOG_AVAILABLE",
  "CONTEXT_RETURN_AVAILABLE",
];

export function allowedEventTypesForActor(actorRole: CommerceActorRole): CommerceNotificationEventType[] {
  switch (actorRole) {
    case "PRODUCER":
      return PRODUCER_ALLOWED;
    case "GROSSISTE_A":
      return GROSSISTE_A_ALLOWED;
    case "GROSSISTE_B":
      return GROSSISTE_B_ALLOWED;
    case "DETAILLANT":
      return DETAILLANT_ALLOWED;
    default:
      return [];
  }
}

export function isEventAllowedForActor(
  eventType: CommerceNotificationEventType,
  actorRole: CommerceActorRole,
): boolean {
  return allowedEventTypesForActor(actorRole).includes(eventType);
}

export function isNotificationEnabledByPreferences(
  notification: CommerceNotification,
  preferences: CommerceNotificationPreferences,
): boolean {
  const cat = categoryForEventType(notification.eventType);
  switch (cat) {
    case "orders":
      return preferences.orders;
    case "deliveries":
      return preferences.deliveries;
    case "settlements":
      return preferences.settlements;
    case "messages":
      return preferences.messages;
    case "mails":
      return preferences.mails;
    case "relations":
      return preferences.relations;
    case "catalogs":
      return notification.eventType === "SPONSORED_CATALOG_AVAILABLE"
        ? preferences.sponsoredCatalogs
        : preferences.catalogs;
    case "wallet":
      return preferences.walletSecurity;
    case "context":
      return true;
    default:
      return true;
  }
}

export function filterNotificationsForActor(
  notifications: CommerceNotification[],
  actorRole: CommerceActorRole,
  preferences: CommerceNotificationPreferences,
  organizationId = "org-demo",
  flags: Record<string, boolean | undefined> = {},
): CommerceNotification[] {
  const accessCtx = buildAccessContext({ actorRole, organizationId, flags });
  return notifications.filter(
    (n) =>
      withNotificationsAccess(accessCtx, () => true) &&
      n.actorRole === actorRole &&
      isEventAllowedForActor(n.eventType, actorRole) &&
      isNotificationEnabledByPreferences(n, preferences),
  );
}

export const DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES: CommerceNotificationPreferences = {
  orders: true,
  deliveries: true,
  settlements: true,
  messages: true,
  mails: true,
  relations: true,
  catalogs: true,
  walletSecurity: true,
  sponsoredCatalogs: false,
};
