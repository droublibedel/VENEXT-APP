import { enqueueOperationalRetry } from "../persistence/operational-retry-queue.js";
import { drainLiveBufferedEvents, liveBufferSize, pushLiveBufferedEvent } from "./backoffice-live-observability-buffer.js";
import { postLiveBatch } from "./backoffice-live-observability-transport.js";

let flushing = false;
let flushScheduled = false;
let hooksInstalled = false;

async function sendBatch(events: ReturnType<typeof drainLiveBufferedEvents>): Promise<void> {
  if (!events.length) return;
  const byKind = new Map<string, Record<string, unknown>[]>();
  for (const e of events) {
    const list = byKind.get(e.kind) ?? [];
    list.push(e.payload);
    byKind.set(e.kind, list);
  }
  const tasks: Promise<{ ok: boolean }>[] = [];
  if (byKind.has("error")) {
    tasks.push(postLiveBatch("/api/backoffice/live/error", { events: byKind.get("error") }));
  }
  if (byKind.has("journey")) {
    tasks.push(postLiveBatch("/api/backoffice/live/journey", { events: byKind.get("journey") }));
  }
  if (byKind.has("operational")) {
    tasks.push(postLiveBatch("/api/backoffice/live/operational", { events: byKind.get("operational") }));
  }
  if (byKind.has("blockage")) {
    tasks.push(postLiveBatch("/api/backoffice/live/blockage", { events: byKind.get("blockage") }));
  }
  const results = await Promise.all(tasks);
  const failed = results.some((r) => r && r.ok === false);
  if (failed) {
    for (const e of events) {
      void enqueueOperationalRetry(e.kind, e.payload);
    }
    requeueFailedLiveEvents(events);
  }
}

export async function flushLiveObservabilityBuffer(force = false): Promise<void> {
  if (flushing && !force) return;
  flushing = true;
  try {
    let events = drainLiveBufferedEvents(25);
    while (events.length) {
      await sendBatch(events);
      events = drainLiveBufferedEvents(25);
    }
  } finally {
    flushing = false;
    flushScheduled = false;
  }
}

export function scheduleLiveObservabilityFlush(delayMs = 400): void {
  if (flushScheduled) return;
  flushScheduled = true;
  const run = () => void flushLiveObservabilityBuffer();
  if (typeof window !== "undefined") {
    window.setTimeout(run, delayMs);
  } else {
    setTimeout(run, delayMs);
  }
}

export function installLiveObservabilityFlushHooks(): void {
  if (hooksInstalled || typeof window === "undefined") return;
  hooksInstalled = true;

  window.addEventListener("online", () => {
    void flushLiveObservabilityBuffer(true);
  });
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushLiveObservabilityBuffer(true);
  });
  window.addEventListener("pagehide", () => {
    void flushLiveObservabilityBuffer(true);
  });

  if ("requestIdleCallback" in window) {
    const idle = () => {
      if (liveBufferSize() > 0) void flushLiveObservabilityBuffer();
      window.requestIdleCallback(idle, { timeout: 15_000 });
    };
    window.requestIdleCallback(idle, { timeout: 15_000 });
  }
}

export function requeueFailedLiveEvents(events: ReturnType<typeof drainLiveBufferedEvents>): void {
  for (const e of events.slice(0, 10)) {
    pushLiveBufferedEvent({ kind: e.kind, priority: e.priority, payload: e.payload });
  }
}
