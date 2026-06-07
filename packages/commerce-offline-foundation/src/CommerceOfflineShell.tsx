import { CommerceOfflineBanner } from "./CommerceOfflineBanner";
import { CommerceOfflineQueue } from "./CommerceOfflineQueue";
import { CommerceSyncStatus } from "./CommerceSyncStatus";
import type { CommerceOfflineActorRole, CommerceOfflineFlags } from "./commerce-offline.types";
import { useCommerceOffline } from "./useCommerceOffline";

type Props = {
  organizationId: string;
  actorRole: CommerceOfflineActorRole;
  flags?: CommerceOfflineFlags;
  flagsHydrated?: boolean;
  locale?: string;
  showQueue?: boolean;
  /** Masque sync idle et file vide — UI terrain premium (VENEXT-MOBILE-UX-03). */
  terrainMinimal?: boolean;
};

export function CommerceOfflineShell({
  organizationId,
  actorRole,
  flags = {},
  flagsHydrated = true,
  locale = "fr-CI",
  showQueue = true,
  terrainMinimal = false,
}: Props) {
  const offline = useCommerceOffline({
    organizationId,
    actorRole,
    flags,
    flagsHydrated,
    enabled: flags.commerce_offline_foundation_enabled !== false,
  });

  if (flags.commerce_offline_foundation_enabled === false) return null;

  const showSync = !terrainMinimal || offline.sync.pendingCount > 0;
  const showQueuePanel =
    showQueue && flags.commerce_offline_queue_enabled !== false && (!terrainMinimal || offline.queue.length > 0);

  return (
    <div data-testid="cof-shell">
      <CommerceOfflineBanner mode={offline.connectivity} locale={locale} />
      {showSync ? (
        <CommerceSyncStatus sync={offline.sync} locale={locale} onSync={() => void offline.syncNow()} />
      ) : null}
      {showQueuePanel ? (
        <CommerceOfflineQueue
          items={offline.queue}
          locale={locale}
          onDiscard={offline.discardQueueItem}
        />
      ) : null}
    </div>
  );
}
