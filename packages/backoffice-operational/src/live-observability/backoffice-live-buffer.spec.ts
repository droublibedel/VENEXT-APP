import { afterEach, describe, expect, it } from "vitest";

import {
  clearLiveBuffer,
  drainLiveBufferedEvents,
  liveBufferSize,
  pushLiveBufferedEvent,
} from "./backoffice-live-observability-buffer.js";

afterEach(() => clearLiveBuffer());

describe("backoffice-live-buffer", () => {
  it("buffers and drains events", () => {
    pushLiveBufferedEvent({ kind: "error", priority: 50, payload: { a: 1 } });
    expect(liveBufferSize()).toBe(1);
    const batch = drainLiveBufferedEvents();
    expect(batch).toHaveLength(1);
    expect(liveBufferSize()).toBe(0);
  });

  it("caps at 100 events", () => {
    for (let i = 0; i < 120; i++) {
      pushLiveBufferedEvent({ kind: "journey", priority: 10, payload: { i } });
    }
    expect(liveBufferSize()).toBeLessThanOrEqual(100);
  });

  it("prioritizes critical events on overflow", () => {
    for (let i = 0; i < 99; i++) {
      pushLiveBufferedEvent({ kind: "operational", priority: 1, payload: { i } });
    }
    pushLiveBufferedEvent({ kind: "error", priority: 95, payload: { critical: true } });
    for (let i = 0; i < 5; i++) {
      pushLiveBufferedEvent({ kind: "journey", priority: 1, payload: { low: i } });
    }
    const hasCritical = drainLiveBufferedEvents(100).some((e) => e.priority >= 90);
    expect(hasCritical).toBe(true);
  });

  it.each([1, 5, 10, 25])("drains batch limit %i", (limit) => {
    for (let i = 0; i < 30; i++) {
      pushLiveBufferedEvent({ kind: "error", priority: 50, payload: { i } });
    }
    const batch = drainLiveBufferedEvents(limit);
    expect(batch.length).toBe(limit);
  });

  it.each(["error", "journey", "operational", "blockage"] as const)("accepts kind %s", (kind) => {
    pushLiveBufferedEvent({ kind, priority: 40, payload: { kind } });
    expect(drainLiveBufferedEvents()[0]?.kind).toBe(kind);
  });
});
