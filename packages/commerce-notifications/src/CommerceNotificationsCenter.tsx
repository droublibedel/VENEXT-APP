import { getNotificationTranslation } from "./commerce-notifications-i18n";
import { CommerceNotificationList } from "./CommerceNotificationList";
import type { CommerceNotification } from "./commerce-notifications.types";

type Props = {
  notifications: CommerceNotification[];
  unreadCount: number;
  locale?: string;
  fallbackUsed?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  onOpen?: (n: CommerceNotification) => void;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
};

export function CommerceNotificationsCenter({
  notifications,
  unreadCount,
  locale = "fr-CI",
  fallbackUsed,
  onRefresh,
  loading,
  onOpen,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  return (
    <section data-testid="cn-center" className="cn-center">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 17, color: "var(--venext-text, #17201c)" }}>
          {getNotificationTranslation("notifications.title", locale)}
          {unreadCount > 0 ? (
            <span style={{ marginLeft: 8, fontSize: 13, color: "var(--venext-accent, #008f73)" }}>{unreadCount}</span>
          ) : null}
          {fallbackUsed ? (
            <span className="cn-dev-badge">{getNotificationTranslation("notifications.devBadge", locale)}</span>
          ) : null}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          {onRefresh ? (
            <button type="button" onClick={onRefresh} disabled={loading} style={{ fontSize: 12 }}>
              {loading ? "…" : "↻"}
            </button>
          ) : null}
          {onMarkAllRead && unreadCount > 0 ? (
            <button type="button" onClick={onMarkAllRead} style={{ fontSize: 12, color: "var(--venext-text-secondary, #526059)" }}>
              {getNotificationTranslation("notifications.markAllRead", locale)}
            </button>
          ) : null}
        </div>
      </header>
      <CommerceNotificationList
        notifications={notifications}
        locale={locale}
        onOpen={onOpen}
        onMarkRead={onMarkRead}
      />
    </section>
  );
}
