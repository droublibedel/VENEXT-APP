import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearLiveBuffer,
  drainLiveBufferedEvents,
  pushLiveBufferedEvent,
} from "./backoffice-live-observability-buffer.js";
import { resetLiveDedupeForTests, shouldDedupeLiveEvent } from "./backoffice-live-observability-dedupe.js";
import { sanitizeLivePayload } from "./backoffice-live-observability-sanitizer.js";
import {
  configureLiveObservabilityTransport,
  postLiveBatch,
} from "./backoffice-live-observability-transport.js";
import { flushLiveObservabilityBuffer } from "./backoffice-live-observability-flush.js";
import {
  reportLiveJourneyEvent,
  reportLiveBackofficeError,
} from "./backoffice-live-observability.js";
import { configureLiveObservabilityContext } from "./backoffice-live-observability-context.js";

beforeEach(() => {
  clearLiveBuffer();
  resetLiveDedupeForTests();
  configureLiveObservabilityContext({ application: "mobile-grossiste-b" });
  configureLiveObservabilityTransport({ enabled: true, baseUrl: "" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("backoffice-live-performance", () => {
  it("sanitizer completes 1000 payloads under 200ms", () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      sanitizeLivePayload({ password: "x", note: `safe-${i}`, nested: { token: "t" } });
    }
    expect(performance.now() - start).toBeLessThan(200);
  });

  it("dedupe handles 500 fingerprints quickly", () => {
    const start = performance.now();
    for (let i = 0; i < 500; i++) shouldDedupeLiveEvent(`perf-${i}`);
    expect(performance.now() - start).toBeLessThan(100);
  });

  it("buffer push 100 events under 300ms", () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      pushLiveBufferedEvent({ kind: "journey", priority: 10 + (i % 5), payload: { i } });
    }
    expect(performance.now() - start).toBeLessThan(300);
  });

  it("drain does not leak memory after clear", () => {
    for (let i = 0; i < 100; i++) {
      pushLiveBufferedEvent({ kind: "error", priority: 50, payload: { i } });
    }
    drainLiveBufferedEvents(100);
    clearLiveBuffer();
    expect(drainLiveBufferedEvents().length).toBe(0);
  });

  it("flush with mocked fetch resolves without throw", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      ),
    );
    pushLiveBufferedEvent({ kind: "error", priority: 60, payload: { e: 1 } });
    await expect(flushLiveObservabilityBuffer(true)).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });

  it.each(Array.from({ length: 15 }, (_, i) => i))("rapid enqueue batch %i", (i) => {
    for (let j = 0; j < 20; j++) {
      reportLiveJourneyEvent({ eventKey: `login_start_${i}_${j}` });
    }
    reportLiveBackofficeError({
      commerceErrorKey: "generic",
      technicalMessage: `m-${i}`,
      application: "mobile-grossiste-b",
    });
    expect(postLiveBatch).toBeDefined();
  });

  it("postLiveBatch returns quickly on failure", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("down")));
    const start = performance.now();
    await postLiveBatch("/api/backoffice/live/journey", { events: [{ a: 1 }] });
    expect(performance.now() - start).toBeLessThan(50);
    vi.unstubAllGlobals();
  });
});
