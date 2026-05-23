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
};

export function CommerceOfflineShell({
  organizationId,
  actorRole,
  flags = {},
  flagsHydrated = true,
  locale = "fr-CI",
  showQueue = true,
}: Props) {
  const offline = useCommerceOffline({
    organizationId,
    actorRole,
    flags,
    flagsHydrated,
    enabled: flags.commerce_offline_foundation_enabled !== false,
  });

  if (flags.commerce_offline_foundation_enabled === false) return null;

  return (
    <div data-testid="cof-shell">
      <CommerceOfflineBanner mode={offline.connectivity} locale={locale} />
      <CommerceSyncStatus sync={offline.sync} locale={locale} onSync={() => void offline.syncNow()} />
      {showQueue && flags.commerce_offline_queue_enabled !== false ? (
        <CommerceOfflineQueue
          items={offline.queue}
          locale={locale}
          onDiscard={offline.discardQueueItem}
        />
      ) : null}
    </div>
  );
}
