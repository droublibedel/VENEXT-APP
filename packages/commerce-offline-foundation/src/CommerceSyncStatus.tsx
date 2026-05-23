import { getOfflineTranslation } from "./commerce-offline-i18n";
import type { CommerceOfflineSyncState } from "./commerce-offline.types";

type Props = {
  sync: CommerceOfflineSyncState;
  locale?: string;
  onSync?: () => void;
};

export function CommerceSyncStatus({ sync, locale = "fr-CI", onSync }: Props) {
  const label =
    sync.pendingCount > 0
      ? getOfflineTranslation("offline.sync.pending", locale)
      : sync.lastSyncAt
        ? getOfflineTranslation("offline.sync.done", locale)
        : getOfflineTranslation("offline.sync.update", locale);

  return (
    <div className="cof-sync" data-testid="cof-sync-status">
      <span>{label}</span>
      {sync.pendingCount > 0 ? <span>({sync.pendingCount})</span> : null}
      {onSync ? (
        <button type="button" onClick={onSync} disabled={sync.inProgress} style={{ fontSize: 11 }}>
          ↻
        </button>
      ) : null}
    </div>
  );
}
