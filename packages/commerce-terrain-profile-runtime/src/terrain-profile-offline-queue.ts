import type { TerrainProfileId } from "./types.js";

export type TerrainOfflineQueueItem = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type UserQueues = Partial<Record<TerrainProfileId, TerrainOfflineQueueItem[]>>;

const queues = new Map<string, UserQueues>();

function queueKey(userId: string, profile: TerrainProfileId): string {
  return `${userId}::${profile}`;
}

export function enqueueTerrainOfflineItem(
  userId: string,
  activeProfile: TerrainProfileId,
  item: Omit<TerrainOfflineQueueItem, "createdAt"> & { createdAt?: string },
): void {
  const userQueues = queues.get(userId) ?? {};
  const list = userQueues[activeProfile] ?? [];
  list.push({ ...item, createdAt: item.createdAt ?? new Date().toISOString() });
  userQueues[activeProfile] = list;
  queues.set(userId, userQueues);
}

export function listTerrainOfflineQueue(
  userId: string,
  activeProfile: TerrainProfileId,
): TerrainOfflineQueueItem[] {
  return [...(queues.get(userId)?.[activeProfile] ?? [])];
}

export function drainTerrainOfflineQueue(
  userId: string,
  activeProfile: TerrainProfileId,
): TerrainOfflineQueueItem[] {
  const userQueues = queues.get(userId);
  const items = [...(userQueues?.[activeProfile] ?? [])];
  if (userQueues) userQueues[activeProfile] = [];
  return items;
}

export function clearTerrainOfflineQueueForProfile(userId: string, profile: TerrainProfileId): void {
  const userQueues = queues.get(userId);
  if (!userQueues) return;
  delete userQueues[profile];
}

export function assertOfflineQueueProfileIsolation(
  userId: string,
  activeProfile: TerrainProfileId,
  itemProfile: TerrainProfileId,
): { allowed: boolean; reason?: string } {
  if (itemProfile !== activeProfile) {
    return { allowed: false, reason: "offline_queue_profile_mismatch" };
  }
  const other = activeProfile === "grossiste_b" ? "detaillant" : "grossiste_b";
  const cross = listTerrainOfflineQueue(userId, other);
  if (cross.length > 0 && itemProfile === activeProfile) {
    return { allowed: true };
  }
  return { allowed: itemProfile === activeProfile };
}

export function resetTerrainOfflineQueues(): void {
  queues.clear();
}
