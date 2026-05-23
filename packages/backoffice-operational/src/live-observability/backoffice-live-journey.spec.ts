import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetBackofficeStore } from "../store/backoffice-store.js";
import { seedBackofficeFeatureFlags } from "../flags/backoffice-feature-flags.js";
import {
  canonicalJourneyKeyForLiveEvent,
  journeyStatusFromLiveEvent,
} from "./journey-live-map.js";
import {
  ingestLiveJourneyEvents,
  resetLiveIngestRateLimitForTests,
} from "./ingest-live-events.js";
import { getBackofficeJourneyRepository } from "../repositories/backoffice-journey.repository.js";
import {
  clearLiveBuffer,
  liveBufferSize,
} from "./backoffice-live-observability-buffer.js";
import {
  configureLiveObservabilityTransport,
  isLiveTransportEnabled,
} from "./backoffice-live-observability-transport.js";
import {
  reportLiveJourneyEvent,
  trackLiveJourneyAbandon,
  trackLiveJourneyFailure,
  trackLiveJourneyStart,
  trackLiveJourneyStep,
  trackLiveJourneySuccess,
} from "./backoffice-live-observability.js";
import { configureLiveObservabilityContext } from "./backoffice-live-observability-context.js";
import { resetLiveDedupeForTests } from "./backoffice-live-observability-dedupe.js";

const LIVE_EVENTS = [
  "login_start",
  "login_success",
  "login_failure",
  "otp_request",
  "otp_failure",
  "otp_success",
  "onboarding_started",
  "onboarding_completed",
  "onboarding_abandoned",
  "onboarding_blocked",
  "product_create_started",
  "product_create_failed",
  "product_create_completed",
  "order_create_started",
  "order_create_failed",
  "order_create_completed",
  "wallet_activation_started",
  "wallet_activation_failed",
  "wallet_activation_completed",
  "relationship_invitation_sent",
  "relationship_accept_failed",
  "relationship_accept_completed",
  "enterprise_invitation_started",
  "enterprise_invitation_completed",
  "enterprise_invitation_abandoned",
];

beforeEach(() => {
  resetBackofficeStore();
  resetLiveIngestRateLimitForTests();
  resetLiveDedupeForTests();
  clearLiveBuffer();
  seedBackofficeFeatureFlags("development");
  configureLiveObservabilityContext({ application: "mobile-grossiste-b" });
  configureLiveObservabilityTransport({ enabled: true, baseUrl: "" });
});

afterEach(() => {
  configureLiveObservabilityTransport({ enabled: true });
});

describe("journey-live-map", () => {
  it.each(LIVE_EVENTS)("maps event %s to canonical key", (eventKey) => {
    const key = canonicalJourneyKeyForLiveEvent(eventKey);
    expect(key.length).toBeGreaterThan(0);
    expect(journeyStatusFromLiveEvent(eventKey)).toBeTruthy();
  });
});

describe("live journey SDK buffer", () => {
  it("tracks start step success lifecycle", () => {
    const id = trackLiveJourneyStart("login_start");
    expect(liveBufferSize()).toBeGreaterThan(0);
    trackLiveJourneyStep(id, "otp_request");
    expect(liveBufferSize()).toBeGreaterThan(0);
    trackLiveJourneySuccess(id, "login_success");
  });

  it("tracks failure and abandon", () => {
    const id = trackLiveJourneyStart("order_create_started");
    trackLiveJourneyFailure(id, "order_create", "timeout");
    const id2 = trackLiveJourneyStart("onboarding_started");
    trackLiveJourneyAbandon(id2, "USER_LEFT");
    expect(liveBufferSize()).toBeGreaterThan(0);
  });

  it.each(LIVE_EVENTS.slice(0, 12))("buffers journey event %s", (eventKey) => {
    reportLiveJourneyEvent({ eventKey, step: eventKey });
    expect(liveBufferSize()).toBeGreaterThan(0);
    clearLiveBuffer();
  });
});

describe("ingestLiveJourneyEvents", () => {
  it("persists journey to store", async () => {
    const n = await ingestLiveJourneyEvents([
      {
        app: "mobile-grossiste-b",
        eventKey: "login_start",
        actorId: "u1",
        status: "IN_PROGRESS",
      },
    ]);
    expect(n).toBe(1);
    const list = await getBackofficeJourneyRepository().list({ journeyKey: "login" });
    expect(list.items.length).toBeGreaterThan(0);
  });

  it.each(LIVE_EVENTS.slice(0, 8))("ingests %s", async (eventKey) => {
    const n = await ingestLiveJourneyEvents([
      { app: "web-grossiste-a", eventKey, actorId: `a-${eventKey}`, status: "IN_PROGRESS" },
    ]);
    expect(n).toBe(1);
  });
});

describe("transport disabled", () => {
  it("skips when disabled", () => {
    configureLiveObservabilityTransport({ enabled: false });
    reportLiveJourneyEvent({ eventKey: "login_start" });
    expect(isLiveTransportEnabled()).toBe(false);
    expect(liveBufferSize()).toBe(0);
  });
});
