import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CommerceOfflineActorRole,
  CommerceOfflineBootstrapPayload,
  CommerceOfflineFlags,
  CommerceOfflineQueueItem,
  CommerceOfflineState,
} from "./commerce-offline.types";
import { useCommerceConnectivity } from "./commerce-offline-connectivity";
import {
  discardOfflineAction,
  enqueueOfflineAction,
  listPendingQueue,
} from "./commerce-offline-queue";
import {
  resolveSyncState,
  syncCommercialData,
  syncPendingActions,
  shouldUseOfflineBff,
} from "./commerce-offline-sync";
import { purgeExpiredCache } from "./commerce-offline-cache";

export type UseCommerceOfflineOptions = {
  organizationId: string;
  actorRole: CommerceOfflineActorRole;
  flags?: CommerceOfflineFlags;
  flagsHydrated?: boolean;
  enabled?: boolean;
};

export function useCommerceOffline(options: UseCommerceOfflineOptions): CommerceOfflineState {
  const {
    organizationId,
    actorRole,
    flags = {},
    flagsHydrated = true,
    enabled = true,
  } = options;

  const { mode: connectivity, refresh: refreshConnectivity } = useCommerceConnectivity(flags);
  const [bootstrap, setBootstrap] = useState<CommerceOfflineBootstrapPayload | null>(null);
  const [queue, setQueue] = useState<CommerceOfflineQueueItem[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [sync, setSync] = useState(() =>
    resolveSyncState(organizationId, connectivity, 0),
  );
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!enabled || flags.commerce_offline_foundation_enabled === false) {
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    purgeExpiredCache(organizationId);
    setQueue(listPendingQueue(organizationId));

    try {
      if (!shouldUseOfflineBff(flags, flagsHydrated) || connectivity === "OFFLINE") {
        const { bootstrap: b, fallbackUsed: fb } = await syncCommercialData({
          organizationId,
          actorRole,
          connectivity: "OFFLINE",
          flags,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setBootstrap(b);
        setFallbackUsed(fb);
      } else {
        const { bootstrap: b, fallbackUsed: fb } = await syncCommercialData({
          organizationId,
          actorRole,
          connectivity,
          flags,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setBootstrap(b);
        setFallbackUsed(fb);
        if (flags.commerce_offline_sync_enabled !== false && connectivity === "ONLINE") {
          const replay = await syncPendingActions(organizationId, connectivity, flags);
          setQueue(listPendingQueue(organizationId));
          setSync(
            resolveSyncState(organizationId, connectivity, listPendingQueue(organizationId).length, false, null),
          );
          if (replay.replayed > 0) {
            setSync((s) => ({ ...s, lastSyncAt: new Date().toISOString() }));
          }
        }
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [actorRole, connectivity, enabled, flags, flagsHydrated, organizationId]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const syncNow = useCallback(async () => {
    await refreshConnectivity();
    await load();
  }, [load, refreshConnectivity]);

  const enqueue = useCallback(
    (item: Omit<CommerceOfflineQueueItem, "id" | "createdAt" | "attempts">) => {
      const id = enqueueOfflineAction(organizationId, item);
      setQueue(listPendingQueue(organizationId));
      setSync(resolveSyncState(organizationId, connectivity, listPendingQueue(organizationId).length));
      return id;
    },
    [connectivity, organizationId],
  );

  const discardQueueItem = useCallback(
    (id: string) => {
      discardOfflineAction(organizationId, id);
      setQueue(listPendingQueue(organizationId));
    },
    [organizationId],
  );

  return {
    connectivity,
    sync: resolveSyncState(organizationId, connectivity, queue.length, loading, sync.lastError),
    queue,
    bootstrap,
    loading,
    fallbackUsed,
    refresh: () => void load(),
    syncNow,
    enqueue,
    discardQueueItem,
  };
}
