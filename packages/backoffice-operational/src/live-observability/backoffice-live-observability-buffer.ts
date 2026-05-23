export type LiveBufferedKind = "error" | "journey" | "operational" | "blockage";

export type LiveBufferedEvent = {
  id: string;
  kind: LiveBufferedKind;
  priority: number;
  createdAt: string;
  payload: Record<string, unknown>;
};

const MAX_EVENTS = 100;
const buffer: LiveBufferedEvent[] = [];

export function pushLiveBufferedEvent(event: Omit<LiveBufferedEvent, "id" | "createdAt">): LiveBufferedEvent {
  const row: LiveBufferedEvent = {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...event,
  };
  buffer.unshift(row);
  while (buffer.length > MAX_EVENTS) {
    const dropped = buffer.pop();
    if (dropped && dropped.priority >= 80) {
      buffer.unshift(dropped);
      break;
    }
  }
  buffer.sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
  while (buffer.length > MAX_EVENTS) buffer.pop();
  return row;
}

export function drainLiveBufferedEvents(limit = 25): LiveBufferedEvent[] {
  if (!buffer.length) return [];
  const batch = buffer.splice(0, Math.min(limit, buffer.length));
  return batch;
}

export function liveBufferSize(): number {
  return buffer.length;
}

export function clearLiveBuffer(): void {
  buffer.length = 0;
}
