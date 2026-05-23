import { memo, useMemo } from "react";

import { sliceVisibleWindow } from "commerce-performance-foundation";

import type { CommerceNotification } from "./commerce-notifications.types";
import { CommerceNotificationCard } from "./CommerceNotificationCard";
import { CommerceNotificationEmptyState } from "./CommerceNotificationEmptyState";

const MAX_VISIBLE = 40;

type Props = {
  notifications: CommerceNotification[];
  locale?: string;
  onOpen?: (n: CommerceNotification) => void;
  onMarkRead?: (id: string) => void;
};

export const CommerceNotificationList = memo(function CommerceNotificationList({
  notifications,
  locale,
  onOpen,
  onMarkRead,
}: Props) {
  const visible = useMemo(
    () => sliceVisibleWindow(notifications, MAX_VISIBLE),
    [notifications],
  );

  if (notifications.length === 0) return <CommerceNotificationEmptyState locale={locale} />;
  return (
    <ul className="cn-center" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {visible.map((n) => (
        <li key={n.id}>
          <CommerceNotificationCard
            notification={n}
            locale={locale}
            onOpen={onOpen ? () => onOpen(n) : undefined}
            onMarkRead={onMarkRead ? () => onMarkRead(n.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
});
