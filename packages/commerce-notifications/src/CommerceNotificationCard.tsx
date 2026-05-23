import { memo } from "react";

import {
  buildNotificationAction,
  buildNotificationHint,
  buildNotificationLabel,
} from "./commerce-notifications-intelligence";
import type { CommerceNotification } from "./commerce-notifications.types";

type Props = {
  notification: CommerceNotification;
  locale?: string;
  onOpen?: () => void;
  onMarkRead?: () => void;
};

export const CommerceNotificationCard = memo(function CommerceNotificationCard({
  notification,
  locale = "fr-CI",
  onOpen,
  onMarkRead,
}: Props) {
  const label = buildNotificationLabel(notification, locale);
  const hint = buildNotificationHint(notification, locale);
  const action = buildNotificationAction(notification, locale);
  const className = [
    "cn-card",
    !notification.read ? "cn-card--unread" : "",
    notification.priority === "URGENT" ? "cn-card--urgent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className} data-testid={`cn-card-${notification.id}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontSize: 14, color: "#f0f4f2" }}>{label}</strong>
        <span style={{ fontSize: 11, color: "#6b7f76" }}>{notification.priority}</span>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9fb0a8" }}>{hint}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {action && onOpen ? (
          <button type="button" onClick={onOpen} style={{ fontSize: 12, color: "#00a884" }}>
            {action.label}
          </button>
        ) : null}
        {!notification.read && onMarkRead ? (
          <button type="button" onClick={onMarkRead} style={{ fontSize: 12, color: "#8fa39a" }}>
            ✓
          </button>
        ) : null}
      </div>
    </article>
  );
});
