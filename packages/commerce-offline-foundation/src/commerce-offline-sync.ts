import type {
  CommerceConnectivityMode,
  CommerceOfflineActorRole,
  CommerceOfflineBootstrapPayload,
  CommerceOfflineEnvelope,
  CommerceOfflineFlags,
  CommerceOfflineSyncState,
} from "./commerce-offline.types";
import { COMMERCE_OFFLINE_SYNC_POLLING_MS } from "./commerce-offline.types";
import { writeOfflineCache } from "./commerce-offline-cache";
import { filterBootstrapForGovernance } from "./commerce-offline-governance";
import { replayOfflineQueue } from "./commerce-offline-queue";
import { readSyncState, writeSyncState } from "./commerce-offline-storage";
import { inferConflictFromError } from "./commerce-offline-conflict";

export function resolveSyncState(
  organizationId: string,
  connectivity: CommerceConnectivityMode,
  pendingCount: number,
  inProgress = false,
  lastError: string | null = null,
): CommerceOfflineSyncState {
  const prev = readSyncState(organizationId);
  return {
    mode: connectivity,
    lastSyncAt: prev?.lastSyncAt ?? null,
    pendingCount,
    inProgress,
    lastError,
  };
}

export function buildDemoBootstrap(
  organizationId: string,
  actorRole: CommerceOfflineActorRole,
): CommerceOfflineBootstrapPayload {
  return {
    organizationId,
    actorRole,
    cachedAt: new Date().toISOString(),
    recentOrders: [{ id: "ord-demo-1", status: "pending" }],
    recentDeliveries: [{ id: "del-demo-1", status: "in_transit" }],
    recentActivity: [{ id: "act-demo-1", type: "ORDER_CREATED" }],
    notifications: [{ id: "notif-demo-1", read: false }],
    recentConversations: [{ id: "thread-demo-1", preview: "Bonjour" }],
    relationalCatalog: [{ id: "cat-demo-1", name: "Catalogue relationnel" }],
    commercialContext: { activeModule: "order" },
    preferences: { locale: "fr-CI" },
  };
}

export async function fetchOfflineBootstrap(
  organizationId: string,
  actorRole: CommerceOfflineActorRole,
  signal?: AbortSignal,
): Promise<CommerceOfflineEnvelope<CommerceOfflineBootstrapPayload> | null> {
  try {
    const res = await fetch(
      `/api/offline/bootstrap?organizationId=${encodeURIComponent(organizationId)}&actorRole=${encodeURIComponent(actorRole)}`,
      { credentials: "include", cache: "no-store", signal },
    );
    if (!res.ok) return null;
    return (await res.json()) as CommerceOfflineEnvelope<CommerceOfflineBootstrapPayload>;
  } catch {
    return null;
  }
}

export async function postOfflineSync(
  organizationId: string,
  body: Record<string, unknown>,
): Promise<CommerceOfflineEnvelope<{ synced: boolean }> | null> {
  try {
    const res = await fetch(`/api/offline/sync?organizationId=${encodeURIComponent(organizationId)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as CommerceOfflineEnvelope<{ synced: boolean }>;
  } catch {
    return null;
  }
}

export async function postOfflineReplay(
  organizationId: string,
  actions: { id: string; type: string }[],
): Promise<CommerceOfflineEnvelope<{ replayed: number; conflicts: string[] }> | null> {
  try {
    const res = await fetch(`/api/offline/replay?organizationId=${encodeURIComponent(organizationId)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions }),
    });
    if (!res.ok) return null;
    return (await res.json()) as CommerceOfflineEnvelope<{ replayed: number; conflicts: string[] }>;
  } catch {
    return null;
  }
}

export function cacheBootstrapPayload(
  organizationId: string,
  bootstrap: CommerceOfflineBootstrapPayload,
  flags: CommerceOfflineFlags,
): void {
  const filtered = filterBootstrapForGovernance(bootstrap, flags);
  writeOfflineCache(organizationId, "recent_orders", filtered.recentOrders);
  writeOfflineCache(organizationId, "recent_deliveries", filtered.recentDeliveries);
  writeOfflineCache(organizationId, "recent_activity", filtered.recentActivity);
  writeOfflineCache(organizationId, "notifications", filtered.notifications);
  writeOfflineCache(organizationId, "recent_conversations", filtered.recentConversations);
  writeOfflineCache(organizationId, "relational_catalog", filtered.relationalCatalog);
  writeOfflineCache(organizationId, "commercial_context", filtered.commercialContext);
  writeOfflineCache(organizationId, "user_preferences", filtered.preferences);
}

export async function syncCommercialData(options: {
  organizationId: string;
  actorRole: CommerceOfflineActorRole;
  connectivity: CommerceConnectivityMode;
  flags: CommerceOfflineFlags;
  signal?: AbortSignal;
}): Promise<{ bootstrap: CommerceOfflineBootstrapPayload; fallbackUsed: boolean }> {
  const { organizationId, actorRole, connectivity, flags, signal } = options;
  if (connectivity === "OFFLINE" || flags.commerce_offline_sync_enabled === false) {
    const demo = buildDemoBootstrap(organizationId, actorRole);
    cacheBootstrapPayload(organizationId, demo, flags);
    return { bootstrap: demo, fallbackUsed: true };
  }

  const env = await fetchOfflineBootstrap(organizationId, actorRole, signal);
  if (env?.payload) {
    cacheBootstrapPayload(organizationId, env.payload, flags);
    writeSyncState(organizationId, {
      mode: connectivity,
      lastSyncAt: new Date().toISOString(),
      pendingCount: 0,
      inProgress: false,
      lastError: null,
    });
    return { bootstrap: env.payload, fallbackUsed: env.fallbackUsed };
  }

  if (flags.venext_live_data_fallback_enabled === false) {
    throw new Error("offline_unavailable");
  }
  const demo = buildDemoBootstrap(organizationId, actorRole);
  cacheBootstrapPayload(organizationId, demo, flags);
  return { bootstrap: demo, fallbackUsed: true };
}

const OFFLINE_REPLAY_INVALID_PREFIX = "venext:offline-replay-invalid:";

function isOfflineReplayInvalidated(organizationId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(`${OFFLINE_REPLAY_INVALID_PREFIX}${organizationId}`) != null;
  } catch {
    return false;
  }
}

export async function syncPendingActions(
  organizationId: string,
  connectivity: CommerceConnectivityMode,
  flags: CommerceOfflineFlags,
): Promise<{ replayed: number; conflicts: string[] }> {
  if (
    connectivity !== "ONLINE" ||
    flags.commerce_offline_queue_enabled === false ||
    isOfflineReplayInvalidated(organizationId)
  ) {
    return { replayed: 0, conflicts: [] };
  }

  const result = await replayOfflineQueue(organizationId, async (item) => {
    try {
      const res = await postOfflineReplay(organizationId, [{ id: item.id, type: item.type }]);
      if (res?.payload) {
        const conflict = res.payload.conflicts.includes(item.id);
        return { ok: !conflict, conflict };
      }
      return { ok: true };
    } catch (e) {
      const c = inferConflictFromError(item, e);
      if (c) return { ok: false, conflict: true };
      return { ok: false };
    }
  });

  return { replayed: result.replayed, conflicts: result.conflicts };
}

export function shouldUseOfflineBff(flags: CommerceOfflineFlags, hydrated: boolean): boolean {
  return (
    hydrated &&
    flags.commerce_offline_foundation_enabled !== false &&
    flags.venext_bff_routes_enabled !== false
  );
}

export const OFFLINE_NO_BACKGROUND_SYNC = COMMERCE_OFFLINE_SYNC_POLLING_MS === 0;
