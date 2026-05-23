import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetBackofficeStore } from "../store/backoffice-store.js";
import { seedBackofficeFeatureFlags } from "../flags/backoffice-feature-flags.js";
import {
  ingestLiveBlockageEvents,
  ingestLiveErrorEvents,
  ingestLiveOperationalEvents,
  resetLiveIngestRateLimitForTests,
} from "./ingest-live-events.js";
import { getBackofficeErrorRepository } from "../repositories/backoffice-error.repository.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import {
  clearLiveBuffer,
  liveBufferSize,
} from "./backoffice-live-observability-buffer.js";
import {
  configureLiveObservabilityTransport,
  postLiveBatch,
} from "./backoffice-live-observability-transport.js";
import {
  initLiveBackofficeObservability,
  reportLiveBackofficeError,
  reportLiveOperationalSignal,
  reportLiveRecoverableFailure,
} from "./backoffice-live-observability.js";
import { resetLiveDedupeForTests } from "./backoffice-live-observability-dedupe.js";
import { registerBackofficeHumanizedErrorReporter } from "commerce-humanized-errors/dist/backoffice-reporter-hook.js";
import { detectUserOperationalBlockage, resetBlockageDetectorForTests } from "./blockage-detector.js";

beforeEach(() => {
  resetBackofficeStore();
  resetLiveIngestRateLimitForTests();
  resetLiveDedupeForTests();
  resetBlockageDetectorForTests();
  clearLiveBuffer();
  seedBackofficeFeatureFlags("development");
  registerBackofficeHumanizedErrorReporter(null);
  configureLiveObservabilityTransport({ enabled: true, baseUrl: "" });
});

afterEach(() => {
  registerBackofficeHumanizedErrorReporter(null);
});

describe("ingestLiveErrorEvents", () => {
  it("creates error events", async () => {
    const n = await ingestLiveErrorEvents([
      {
        app: "mobile-detaillant",
        errorType: "otp_invalid",
        userFacingMessage: "OTP",
        technicalMessage: "live",
      },
    ]);
    expect(n).toBe(1);
    const list = await getBackofficeErrorRepository().list({});
    expect(list.items.length).toBeGreaterThan(0);
  });

  it.each([
    "connection_error",
    "wallet_locked",
    "catalog_unavailable",
    "message_not_sent",
    "unauthorized_access",
  ])("ingests error type %s", async (errorType) => {
    const n = await ingestLiveErrorEvents([
      { app: "web-grossiste-a", errorType, technicalMessage: "t" },
    ]);
    expect(n).toBe(1);
  });

  it("rate limits spam per app", async () => {
    const events = Array.from({ length: 150 }, () => ({
      app: "spam-app",
      errorType: "generic",
    }));
    const n = await ingestLiveErrorEvents(events);
    expect(n).toBeLessThanOrEqual(120);
  });
});

describe("ingest operational and blockage", () => {
  it("ingests operational signals", async () => {
    const n = await ingestLiveOperationalEvents([
      { app: "mobile-grossiste-b", signal: "offline", level: "WARNING" },
    ]);
    expect(n).toBe(1);
    expect(getBackofficeStore().notifications.length).toBeGreaterThan(0);
  });

  it("ingests blockage", async () => {
    const n = await ingestLiveBlockageEvents([
      { app: "mobile-grossiste-b", code: "retry_loop", severity: "HIGH", screen: "/wallet" },
    ]);
    expect(n).toBe(1);
  });
});

describe("live SDK", () => {
  it("init wires humanized reporter", () => {
    initLiveBackofficeObservability({ application: "mobile-grossiste-b" });
    reportLiveBackofficeError({
      commerceErrorKey: "otp_invalid",
      technicalMessage: "bad otp",
      application: "mobile-grossiste-b",
      screen: "/otp",
    });
    expect(liveBufferSize()).toBeGreaterThan(0);
  });

  it("buffers operational signals", () => {
    initLiveBackofficeObservability({ application: "web-grossiste-a" });
    reportLiveOperationalSignal({ signal: "network_degraded", level: "WARNING" });
    reportLiveRecoverableFailure({ feature: "catalog", reason: "timeout" });
    expect(liveBufferSize()).toBeGreaterThan(0);
  });
});

describe("blockage detector", () => {
  it.each(["error_repeat", "retry_loop", "rage_click", "long_abandon", "navigation_stuck"] as const)(
    "detects signal %s",
    (signal) => {
      if (signal === "error_repeat") {
        detectUserOperationalBlockage({ screen: "s", signal, errorType: "otp_invalid" });
        detectUserOperationalBlockage({ screen: "s", signal, errorType: "otp_invalid" });
        detectUserOperationalBlockage({ screen: "s", signal, errorType: "otp_invalid" });
      }
      const r = detectUserOperationalBlockage({ screen: "checkout", signal, journeyKey: "order" });
      if (signal === "long_abandon" || signal === "navigation_stuck") {
        expect(r?.severity).toBe("HIGH");
      }
    },
  );
});

describe("postLiveBatch", () => {
  it("never throws on network failure", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    const res = await postLiveBatch("/api/backoffice/live/error", { events: [] });
    expect(res.ok).toBe(false);
    vi.unstubAllGlobals();
  });
});
