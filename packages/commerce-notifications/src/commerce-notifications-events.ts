import type {
  CommerceActorRole,
  CommerceNotification,
  CommerceNotificationCategory,
  CommerceNotificationContextLink,
  CommerceNotificationEventType,
} from "./commerce-notifications.types";
import { resolveNotificationPriority } from "./commerce-notifications-priority";

export const COMMERCE_NOTIFICATION_EVENT_TYPES: CommerceNotificationEventType[] = [
  "ORDER_CREATED",
  "ORDER_VALIDATED",
  "ORDER_UPDATED",
  "DELIVERY_STARTED",
  "DELIVERY_NEAR",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "SETTLEMENT_PENDING",
  "WALLET_SECURED",
  "WALLET_LOCKED",
  "MESSAGE_RECEIVED",
  "MAIL_RECEIVED",
  "RELATION_REQUEST",
  "RELATION_ACCEPTED",
  "CATALOG_AVAILABLE",
  "SPONSORED_CATALOG_AVAILABLE",
  "CONTEXT_RETURN_AVAILABLE",
];

const FORBIDDEN_SOCIAL = ["like", "follow", "reaction", "view_count", "ranking", "score"];

export function categoryForEventType(type: CommerceNotificationEventType): CommerceNotificationCategory {
  const map: Record<CommerceNotificationEventType, CommerceNotificationCategory> = {
    ORDER_CREATED: "orders",
    ORDER_VALIDATED: "orders",
    ORDER_UPDATED: "orders",
    DELIVERY_STARTED: "deliveries",
    DELIVERY_NEAR: "deliveries",
    DELIVERY_CONFIRMED: "deliveries",
    SETTLEMENT_RECEIVED: "settlements",
    SETTLEMENT_PENDING: "settlements",
    WALLET_SECURED: "wallet",
    WALLET_LOCKED: "wallet",
    MESSAGE_RECEIVED: "messages",
    MAIL_RECEIVED: "mails",
    RELATION_REQUEST: "relations",
    RELATION_ACCEPTED: "relations",
    CATALOG_AVAILABLE: "catalogs",
    SPONSORED_CATALOG_AVAILABLE: "catalogs",
    CONTEXT_RETURN_AVAILABLE: "context",
  };
  return map[type];
}

export function titleKeyForEventType(type: CommerceNotificationEventType): string {
  return `notifications.events.${type}`;
}

export function assertCommerceEventType(type: string): type is CommerceNotificationEventType {
  return COMMERCE_NOTIFICATION_EVENT_TYPES.includes(type as CommerceNotificationEventType);
}

export function assertNotSocialEvent(meta: Record<string, string> = {}): boolean {
  const blob = JSON.stringify(meta).toLowerCase();
  return !FORBIDDEN_SOCIAL.some((w) => blob.includes(w));
}

export type CreateCommerceNotificationInput = {
  eventType: CommerceNotificationEventType;
  actorRole: CommerceActorRole;
  organizationId: string;
  contextLink?: CommerceNotificationContextLink;
  meta?: Record<string, string>;
  createdAt?: string;
};

export function createCommerceNotification(input: CreateCommerceNotificationInput): CommerceNotification {
  if (!assertNotSocialEvent(input.meta)) {
    throw new Error("Événement non autorisé — logique sociale interdite.");
  }
  const eventType = input.eventType;
  return {
    id: `ntf-${eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventType,
    priority: resolveNotificationPriority(eventType),
    category: categoryForEventType(eventType),
    actorRole: input.actorRole,
    organizationId: input.organizationId,
    titleKey: titleKeyForEventType(eventType),
    bodyKey: `notifications.hints.${eventType}`,
    read: false,
    createdAt: input.createdAt ?? new Date().toISOString(),
    contextLink: input.contextLink,
    meta: input.meta,
  };
}

/** Démo — événements commerce réalistes (pas de feed social). */
export function buildDemoCommerceNotifications(
  actorRole: CommerceActorRole,
  organizationId: string,
): CommerceNotification[] {
  const base = (eventType: CommerceNotificationEventType, link?: CommerceNotificationContextLink) =>
    createCommerceNotification({ eventType, actorRole, organizationId, contextLink: link });

  const common: CommerceNotification[] = [
    base("ORDER_VALIDATED", { activeModule: "order", orderId: "order-bc-001", module: "order" }),
    base("DELIVERY_NEAR", { activeModule: "delivery", deliveryId: "delivery-bc-001", module: "delivery" }),
    base("SETTLEMENT_PENDING", {
      activeModule: "wallet",
      settlementId: "settlement-bc-001",
      module: "wallet",
    }),
  ];

  if (actorRole === "PRODUCER") {
    return [
      ...common,
      base("MAIL_RECEIVED", { activeModule: "mail", mailThreadId: "mail-ab-001", module: "mail" }),
      base("RELATION_ACCEPTED", { activeModule: "network", partnerId: "org-grossiste-a-nord-plus", module: "network" }),
    ];
  }
  if (actorRole === "GROSSISTE_A") {
    return [
      ...common,
      base("CATALOG_AVAILABLE", { activeModule: "catalog", catalogId: "catalog-ab", module: "catalog" }),
      base("MAIL_RECEIVED", { activeModule: "mail", mailThreadId: "mail-ab-001", module: "mail" }),
    ];
  }
  if (actorRole === "GROSSISTE_B") {
    return [
      base("ORDER_CREATED", { activeModule: "order", orderId: "order-bc-001", module: "order" }),
      base("MESSAGE_RECEIVED", {
        activeModule: "messaging",
        conversationId: "thread-bc-001",
        module: "messaging",
      }),
      base("WALLET_LOCKED", { activeModule: "wallet", module: "wallet" }),
    ];
  }
  return [
    base("DELIVERY_CONFIRMED", { activeModule: "delivery", deliveryId: "delivery-bc-001", module: "delivery" }),
    base("CATALOG_AVAILABLE", { activeModule: "catalog", catalogId: "catalog-bc-yop", module: "catalog" }),
    base("MESSAGE_RECEIVED", {
      activeModule: "messaging",
      conversationId: "thread-bc-001",
      module: "messaging",
    }),
  ];
}
