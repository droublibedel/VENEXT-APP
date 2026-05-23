import type {
  CommercialContextRouter,
  CommercialContextTransitionId,
} from "commercial-context-routing";

import { filterNotificationsForActor } from "./commerce-notifications-governance";
import { compareNotificationPriority } from "./commerce-notifications-priority";
import type {
  CommerceActorRole,
  CommerceNotification,
  CommerceNotificationPreferences,
} from "./commerce-notifications.types";

export function sortNotifications(items: CommerceNotification[]): CommerceNotification[] {
  return [...items].sort((a, b) => {
    const p = compareNotificationPriority(a.priority, b.priority);
    if (p !== 0) return p;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function countUnread(items: CommerceNotification[]): number {
  return items.filter((n) => !n.read).length;
}

export function markNotificationReadLocal(
  items: CommerceNotification[],
  id: string,
): CommerceNotification[] {
  return items.map((n) => (n.id === id ? { ...n, read: true } : n));
}

export function markAllNotificationsReadLocal(
  items: CommerceNotification[],
): CommerceNotification[] {
  return items.map((n) => ({ ...n, read: true }));
}

export function buildCenterViewModel(
  items: CommerceNotification[],
  actorRole: CommerceActorRole,
  preferences: CommerceNotificationPreferences,
) {
  const visible = sortNotifications(filterNotificationsForActor(items, actorRole, preferences));
  return {
    notifications: visible,
    unreadCount: countUnread(visible),
    hasUrgent: visible.some((n) => n.priority === "URGENT" && !n.read),
  };
}

export function openNotificationContext(
  router: CommercialContextRouter,
  notification: CommerceNotification,
  flags: { commerce_notification_context_routing_enabled?: boolean },
): boolean {
  if (flags.commerce_notification_context_routing_enabled === false) return false;
  const link = notification.contextLink;
  if (!link?.module) return false;
  const transition: CommercialContextTransitionId =
    link.module === "order"
      ? "messaging-to-order"
      : link.module === "delivery"
        ? "order-to-delivery"
        : link.module === "wallet"
          ? "order-to-wallet"
          : link.module === "messaging"
            ? "order-to-messaging"
            : link.module === "mail"
              ? "order-to-mail"
              : "context-back";
  router.navigate(transition, { activeModule: link.module, ...link });
  return true;
}
