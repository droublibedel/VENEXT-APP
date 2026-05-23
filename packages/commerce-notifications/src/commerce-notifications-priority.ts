import type {
  CommerceNotificationEventType,
  CommerceNotificationPriority,
} from "./commerce-notifications.types";

const URGENT: CommerceNotificationEventType[] = [
  "WALLET_LOCKED",
  "SETTLEMENT_PENDING",
  "DELIVERY_NEAR",
  "ORDER_UPDATED",
];

const IMPORTANT: CommerceNotificationEventType[] = [
  "ORDER_VALIDATED",
  "ORDER_CREATED",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "MAIL_RECEIVED",
  "MESSAGE_RECEIVED",
  "RELATION_REQUEST",
];

const LOW: CommerceNotificationEventType[] = ["SPONSORED_CATALOG_AVAILABLE", "CONTEXT_RETURN_AVAILABLE"];

export function resolveNotificationPriority(
  eventType: CommerceNotificationEventType,
): CommerceNotificationPriority {
  if (URGENT.includes(eventType)) return "URGENT";
  if (LOW.includes(eventType)) return "LOW";
  if (IMPORTANT.includes(eventType)) return "IMPORTANT";
  return "NORMAL";
}

export function compareNotificationPriority(
  a: CommerceNotificationPriority,
  b: CommerceNotificationPriority,
): number {
  const rank: Record<CommerceNotificationPriority, number> = {
    URGENT: 4,
    IMPORTANT: 3,
    NORMAL: 2,
    LOW: 1,
  };
  return rank[b] - rank[a];
}

export function isUrgentRare(eventType: CommerceNotificationEventType): boolean {
  return URGENT.includes(eventType);
}
