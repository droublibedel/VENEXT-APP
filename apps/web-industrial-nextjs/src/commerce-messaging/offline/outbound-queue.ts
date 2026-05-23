const STORAGE_KEY = "venext_commerce_outbound_v1";

export type OutboundQueued = {
  id: string;
  threadId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

function readAll(): OutboundQueued[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OutboundQueued[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: OutboundQueued[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueueOutbound(threadId: string, payload: Record<string, unknown>): OutboundQueued {
  const item: OutboundQueued = {
    id: crypto.randomUUID(),
    threadId,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  const next = [...readAll(), item];
  writeAll(next);
  return item;
}

export function listOutbound(threadId?: string): OutboundQueued[] {
  const all = readAll();
  return threadId ? all.filter((q) => q.threadId === threadId) : all;
}

export function removeOutbound(id: string) {
  writeAll(readAll().filter((q) => q.id !== id));
}

export function bumpAttempt(id: string) {
  writeAll(
    readAll().map((q) => (q.id === id ? { ...q, attempts: q.attempts + 1 } : q)),
  );
}
