import type { CommerceOfflineQueueActionType, CommerceOfflineQueueItem } from "./commerce-offline.types";
import { readQueueStore, writeQueueStore } from "./commerce-offline-storage";
import { isWalletFinancialActionBlocked } from "./commerce-offline-governance";

const MAX_QUEUE = 50;

export function enqueueOfflineAction(
  organizationId: string,
  input: Omit<CommerceOfflineQueueItem, "id" | "createdAt" | "attempts">,
): string {
  if (isWalletFinancialActionBlocked(input.type, input.payload)) {
    throw new Error("Action financière interdite hors ligne.");
  }
  const id = `off-${input.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: CommerceOfflineQueueItem = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  const queue = readQueueStore(organizationId);
  queue.push(item);
  writeQueueStore(organizationId, queue.slice(-MAX_QUEUE));
  return id;
}

export function discardOfflineAction(organizationId: string, id: string): boolean {
  const queue = readQueueStore(organizationId);
  const next = queue.filter((q) => q.id !== id);
  if (next.length === queue.length) return false;
  writeQueueStore(organizationId, next);
  return true;
}

export type ReplayResult = {
  replayed: number;
  failed: number;
  discarded: number;
  conflicts: string[];
};

export async function replayOfflineQueue(
  organizationId: string,
  executor: (item: CommerceOfflineQueueItem) => Promise<{ ok: boolean; conflict?: boolean }>,
): Promise<ReplayResult> {
  const queue = readQueueStore(organizationId);
  let replayed = 0;
  let failed = 0;
  let discarded = 0;
  const conflicts: string[] = [];
  const remaining: CommerceOfflineQueueItem[] = [];

  for (const item of queue) {
    const result = await executor(item);
    if (result.ok) {
      replayed += 1;
      discarded += 1;
      continue;
    }
    if (result.conflict) {
      conflicts.push(item.id);
      discarded += 1;
      continue;
    }
    const attempts = item.attempts + 1;
    if (attempts >= 3) {
      failed += 1;
      discarded += 1;
      continue;
    }
    remaining.push({ ...item, attempts });
    failed += 1;
  }

  writeQueueStore(organizationId, remaining);
  return { replayed, failed, discarded, conflicts };
}

export function listPendingQueue(organizationId: string): CommerceOfflineQueueItem[] {
  return readQueueStore(organizationId);
}

export function isAllowedOfflineAction(type: CommerceOfflineQueueActionType): boolean {
  const allowed: CommerceOfflineQueueActionType[] = [
    "SEND_MESSAGE",
    "CONFIRM_ORDER",
    "CONFIRM_DELIVERY",
    "MARK_NOTIFICATION_READ",
    "ACTIVATE_RELATION",
    "WALLET_LIGHT_ACTION",
  ];
  return allowed.includes(type);
}
