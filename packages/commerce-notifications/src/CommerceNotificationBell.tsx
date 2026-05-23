import { memo } from "react";

type Props = {
  unreadCount: number;
  onClick?: () => void;
  "data-testid"?: string;
};

export const CommerceNotificationBell = memo(function CommerceNotificationBell({
  unreadCount,
  onClick,
  "data-testid": testId = "cn-bell",
}: Props) {
  return (
    <button type="button" className="cn-bell" onClick={onClick} data-testid={testId} aria-label="Notifications">
      🔔
      {unreadCount > 0 ? (
        <span className="cn-bell-badge" data-testid="cn-bell-badge">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
});
