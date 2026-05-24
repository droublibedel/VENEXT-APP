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
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 ? (
        <span className="cn-bell-badge" data-testid="cn-bell-badge">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
});
