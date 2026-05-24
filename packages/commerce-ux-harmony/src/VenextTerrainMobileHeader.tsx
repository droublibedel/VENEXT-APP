import type { ReactNode } from "react";
import { memo } from "react";

export type VenextTerrainMobileHeaderProps = {
  title: string;
  onMessaging: () => void;
  onSearch: () => void;
  onProfile: () => void;
  notificationsSlot: ReactNode;
  messagingUnread?: number;
  brandLabel?: string;
  "data-testid"?: string;
};

function IconButton({
  label,
  onClick,
  testId,
  children,
  badge,
}: {
  label: string;
  onClick: () => void;
  testId: string;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <button type="button" className="vtmh-icon-btn" onClick={onClick} aria-label={label} data-testid={testId}>
      {children}
      {badge && badge > 0 ? (
        <span className="vtmh-badge" data-testid={`${testId}-badge`}>
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}

export const VenextTerrainMobileHeader = memo(function VenextTerrainMobileHeader({
  title,
  onMessaging,
  onSearch,
  onProfile,
  notificationsSlot,
  messagingUnread = 0,
  brandLabel,
  "data-testid": testId = "venext-terrain-mobile-header",
}: VenextTerrainMobileHeaderProps) {
  return (
    <header className="vtmh-root" data-testid={testId}>
      <div className="vtmh-left">
        <IconButton
          label="Messagerie"
          onClick={onMessaging}
          testId={`${testId}-messaging`}
          badge={messagingUnread}
        >
          <MessageIcon />
        </IconButton>
      </div>
      <div className="vtmh-center" data-testid={`${testId}-title`}>
        {brandLabel ? <span className="vtmh-brand">{brandLabel}</span> : null}
        <h1 className="vtmh-title">{title}</h1>
      </div>
      <div className="vtmh-right">
        <IconButton label="Rechercher" onClick={onSearch} testId={`${testId}-search`}>
          <SearchIcon />
        </IconButton>
        <div className="vtmh-notifications">{notificationsSlot}</div>
        <IconButton label="Profil" onClick={onProfile} testId={`${testId}-profile`}>
          <UserIcon />
        </IconButton>
      </div>
    </header>
  );
});

function MessageIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
