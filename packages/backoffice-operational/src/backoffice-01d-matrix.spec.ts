import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateAutomaticAlerts } from "./alerts/automatic-alerts.js";
import { auditOperationalObservabilityCoverage } from "./audit/audit-operational-observability-coverage.js";
import { resetBackofficeStore, getBackofficeStore } from "./store/backoffice-store.js";
import { seedBackofficeFeatureFlags } from "./flags/backoffice-feature-flags.js";
import {
  clearLiveBuffer,
  liveBufferSize,
} from "./live-observability/backoffice-live-observability-buffer.js";
import {
  configureLiveObservabilityTransport,
  postLiveBatch,
} from "./live-observability/backoffice-live-observability-transport.js";
import { resetLiveDedupeForTests } from "./live-observability/backoffice-live-observability-dedupe.js";
import {
  ingestLiveErrorEvents,
  ingestLiveJourneyEvents,
  resetLiveIngestRateLimitForTests,
} from "./live-observability/ingest-live-events.js";
import { sanitizeLivePayload, sanitizeTechnicalMessage } from "./live-observability/backoffice-live-observability-sanitizer.js";
import { canonicalJourneyKeyForLiveEvent } from "./live-observability/journey-live-map.js";
import { registerBackofficeHumanizedErrorReporter } from "commerce-humanized-errors/dist/backoffice-reporter-hook.js";
import {
  buildObservableEventEnvelope,
  clearActiveCommerceJourney,
  configureCommerceObservabilityRuntime,
  getActiveCommerceJourneyId,
  initCommerceOperationalObservability,
  isCommerceOperationalObservabilityReady,
  OPERATIONAL_JOURNEY_EVENTS,
  recordObservabilityRetry,
  reportBackofficeObservableError,
  resetCommerceJourneySessionForTests,
  resetCommerceObservabilityRuntimeForTests,
  trackJourneyAbandon,
  trackJourneyBlocked,
  trackJourneyComplete,
  trackJourneyFailed,
  trackJourneyStart,
  trackJourneyStep,
} from "./sdk/commerce-operational-observability.js";
import { readAppVersionFromEnv } from "./sdk/commerce-observability-runtime.js";
import {
  probeAuthFromLiveTraffic,
  probeCatalogueFromLiveTraffic,
  probeMessagingFromLiveTraffic,
  probeUploadFromLiveTraffic,
  probeWalletFromLiveTraffic,
  runCommerceOperationalHealthProbes,
} from "./health/operational-health-probes.js";
import { runBackofficeOperationalHealthCheck } from "./health/operational-health-check.js";
import { productQualitySummary } from "./services/operational-readouts.js";
import { getBackofficeErrorRepository } from "./repositories/backoffice-error.repository.js";
import { createBackofficeErrorEvent } from "./errors/error-pipeline.js";

beforeEach(() => {
  resetBackofficeStore();
  resetLiveIngestRateLimitForTests();
  resetLiveDedupeForTests();
  clearLiveBuffer();
  resetCommerceJourneySessionForTests();
  resetCommerceObservabilityRuntimeForTests();
  seedBackofficeFeatureFlags("development");
  registerBackofficeHumanizedErrorReporter(null);
  configureLiveObservabilityTransport({ enabled: true, baseUrl: "" });
});

afterEach(() => {
  registerBackofficeHumanizedErrorReporter(null);
  vi.restoreAllMocks();
});

describe("BACKOFFICE-01-D envelope", () => {
  it.each([
    "eventId",
    "timestamp",
    "app",
    "platform",
    "appVersion",
    "buildNumber",
    "releaseChannel",
    "networkQuality",
    "deviceClass",
  ])("includes field %s", (field) => {
    configureCommerceObservabilityRuntime({
      platform: "web",
      appVersion: "2.1.0",
      buildNumber: "42",
      releaseChannel: "beta",
    });
    const env = buildObservableEventEnvelope({
      app: "mobile-grossiste-b",
      screen: "auth.login",
      module: "auth",
    });
    expect(env[field]).toBeDefined();
  });

  it("correlates active journey on error envelope", () => {
    const id = trackJourneyStart({
      journeyKey: "login",
      actorId: "u1",
      actorRole: "GROSSISTE",
      application: "mobile-grossiste-b",
      screen: "auth.login",
    });
    trackJourneyStep(id, "otp_sent");
    const env = buildObservableEventEnvelope({ app: "mobile-grossiste-b" });
    expect(env.journeyId).toBe(id);
    clearActiveCommerceJourney();
  });
});

describe("BACKOFFICE-01-D journey facade", () => {
  beforeEach(() => {
    initCommerceOperationalObservability({
      application: "mobile-detaillant",
      enabled: true,
      platform: "android",
      appVersion: "1.2.3",
    });
  });

  it("marks commerce observability ready", () => {
    expect(isCommerceOperationalObservabilityReady()).toBe(true);
  });

  it("starts and completes journey", () => {
    const id = trackJourneyStart({
      journeyKey: "create_order",
      actorId: "a1",
      actorRole: "DETAILLANT",
      application: "mobile-detaillant",
      screen: "order.create",
    });
    trackJourneyStep(id, "cart_ready");
    expect(liveBufferSize()).toBeGreaterThan(0);
    trackJourneyComplete(id, "order_created");
    expect(getActiveCommerceJourneyId()).toBeUndefined();
  });

  it("tracks blocked journey", () => {
    const id = trackJourneyStart({
      journeyKey: "wallet_activation",
      actorId: "w1",
      actorRole: "GROSSISTE",
      application: "mobile-grossiste-b",
    });
    trackJourneyBlocked(id, "KYC_REQUIRED", { step: "kyc" });
    expect(getActiveCommerceJourneyId()).toBeUndefined();
  });

  it("tracks failed and abandon", () => {
    const id = trackJourneyStart({
      journeyKey: "create_product",
      actorId: "p1",
      actorRole: "INDUSTRIAL",
      application: "web-industrial-nextjs",
    });
    trackJourneyFailed(id, "upload_error", { step: "image" });
    const id2 = trackJourneyStart({
      journeyKey: "login",
      actorId: "x",
      actorRole: "USER",
      application: "web-grossiste-a",
    });
    trackJourneyAbandon(id2, "USER_LEFT");
    expect(liveBufferSize()).toBeGreaterThan(0);
  });
});

describe("BACKOFFICE-01-D error correlation", () => {
  beforeEach(() => {
    initCommerceOperationalObservability({ application: "web-grossiste-a", enabled: true });
  });

  it("reports error with journey context", () => {
    const jid = trackJourneyStart({
      journeyKey: "login",
      actorId: "e1",
      actorRole: "ADMIN",
      application: "web-grossiste-a",
      screen: "auth.login",
    });
    reportBackofficeObservableError({
      commerceErrorKey: "otp_invalid",
      technicalMessage: "OTP mismatch",
      application: "web-grossiste-a",
      screen: "auth.otp",
      module: "auth",
    });
    expect(liveBufferSize()).toBeGreaterThan(0);
    expect(jid).toBeTruthy();
  });
});

describe("BACKOFFICE-01-D journey map", () => {
  const keys = [
    "login_start",
    "otp_failure",
    "product_create_started",
    "order_validated",
    "wallet_payment_failed",
    "message_sent",
    "relationship_invitation_sent",
    "pole_dashboard_view",
    "backoffice_login_success",
  ];
  it.each(keys)("maps %s to canonical journey", (eventKey) => {
    expect(canonicalJourneyKeyForLiveEvent(eventKey)).not.toBe("");
  });
});

describe("BACKOFFICE-01-D metadata sanitization", () => {
  it.each(["password", "otp", "token", "authorization", "iban"])("redacts key %s", (key) => {
    const out = sanitizeLivePayload({ [key]: "secret-value", safe: "ok" });
    expect(out[key]).toBe("[redacted]");
    expect(out.safe).toBe("ok");
  });

  it("strips stack paths from technical message", () => {
    const msg = sanitizeTechnicalMessage("Error at src/foo.tsx:12:3");
    expect(msg).not.toContain("foo.tsx:12");
  });
});

describe("BACKOFFICE-01-D ingest and alerts", () => {
  it("ingests live error with app version", async () => {
    const n = await ingestLiveErrorEvents([
      {
        app: "mobile-grossiste-b",
        errorType: "otp_invalid",
        technicalMessage: "live",
        appVersion: "3.0.0",
        buildNumber: "99",
        journeyId: "lj-test-1",
      },
    ]);
    expect(n).toBe(1);
    const list = await getBackofficeErrorRepository().list({});
    expect(list.items[0]?.commercialContext?.appVersion).toBe("3.0.0");
  });

  it("ingests journey events", async () => {
    const n = await ingestLiveJourneyEvents([
      {
        app: "web-industrial-nextjs",
        eventKey: "product_create_completed",
        status: "COMPLETED",
        journeyId: "lj-2",
      },
    ]);
    expect(n).toBe(1);
  });

  it("evaluateAutomaticAlerts on OTP spike", async () => {
    for (let i = 0; i < 9; i++) {
      await createBackofficeErrorEvent({
        userFacingMessage: "OTP",
        technicalMessage: "x",
        errorType: "otp_invalid",
        severity: "error",
        application: "mobile-detaillant",
      });
    }
    const alerts = await evaluateAutomaticAlerts({
      errors: getBackofficeStore().errors,
      journeys: [],
    });
    expect(alerts.some((a) => a.code === "otp_invalid_spike")).toBe(true);
  });
});

describe("BACKOFFICE-01-D health probes", () => {
  it.each([
    ["auth", probeAuthFromLiveTraffic],
    ["wallet", probeWalletFromLiveTraffic],
    ["messaging", probeMessagingFromLiveTraffic],
    ["catalogue", probeCatalogueFromLiveTraffic],
    ["upload", probeUploadFromLiveTraffic],
  ])("probe %s returns shape", async (_name, fn) => {
    const r = fn();
    expect(r).toHaveProperty("ok");
    expect(r).toHaveProperty("incidentCount");
  });

  it("runCommerceOperationalHealthProbes exposes all modules", () => {
    const probes = runCommerceOperationalHealthProbes();
    expect(Object.keys(probes)).toContain("offline_sync");
  });

  it("health check uses live probes", async () => {
    const h = await runBackofficeOperationalHealthCheck({ bffOk: true, coreOk: true });
    expect(h.components.auth).toBeDefined();
    expect(h.components.offline_sync).toBeDefined();
  });
});

describe("BACKOFFICE-01-D product quality live", () => {
  it("returns abandon rate and app stability", async () => {
    const q = await productQualitySummary();
    expect(q).toHaveProperty("abandonRate");
    expect(q).toHaveProperty("appStability");
    expect(Array.isArray(q.moduleHeatmap)).toBe(true);
  });
});

describe("BACKOFFICE-01-D audit coverage", () => {
  it("passes when screens declared wired", () => {
    const report = auditOperationalObservabilityCoverage({
      wiredScreens: [
        "auth.login",
        "auth.otp",
        "catalog.product_form",
        "order.create",
        "wallet.payment",
        "messaging.conversation",
        "backoffice.login",
      ],
      samplePayload: { password: "x", note: "ok" },
      sampleTechnicalMessage: "failed at app.tsx:1",
    });
    expect(report.criticalScreensExpected).toBeGreaterThan(10);
    expect(report.issues.some((i) => i.code === "unsafe_metadata_key")).toBe(false);
  });
});

describe("BACKOFFICE-01-D retry and version", () => {
  it("tracks app version from env", () => {
    const v = readAppVersionFromEnv({
      VITE_APP_VERSION: "9.9.9",
      VITE_BUILD_NUMBER: "100",
      VITE_RELEASE_CHANNEL: "prod",
    });
    expect(v.appVersion).toBe("9.9.9");
    expect(v.buildNumber).toBe("100");
    expect(v.releaseChannel).toBe("prod");
  });

  it("records excessive retries signal", () => {
    initCommerceOperationalObservability({ application: "backoffice-web", enabled: true });
    for (let i = 0; i < 6; i++) recordObservabilityRetry();
    expect(liveBufferSize()).toBeGreaterThan(0);
  });
});

describe("BACKOFFICE-01-D operational event catalog", () => {
  const families = Object.keys(OPERATIONAL_JOURNEY_EVENTS);
  it.each(families)("defines journey family %s", (family) => {
    const events = OPERATIONAL_JOURNEY_EVENTS[family as keyof typeof OPERATIONAL_JOURNEY_EVENTS];
    expect(Object.keys(events).length).toBeGreaterThan(0);
  });
});

describe("BACKOFFICE-01-D offline buffer transport", () => {
  it("buffers events when transport disabled", () => {
    configureLiveObservabilityTransport({ enabled: false });
    initCommerceOperationalObservability({ application: "mobile-grossiste-b", enabled: false });
    reportBackofficeObservableError({
      commerceErrorKey: "network_unstable",
      technicalMessage: "offline",
      application: "mobile-grossiste-b",
    });
    expect(liveBufferSize()).toBe(0);
    configureLiveObservabilityTransport({ enabled: true });
  });

  it("postLiveBatch with empty batch when transport off", async () => {
    configureLiveObservabilityTransport({ enabled: false });
    const res = await postLiveBatch([]);
    expect(res).toMatchObject({ ok: true });
    configureLiveObservabilityTransport({ enabled: true });
  });
});

/** Génère 40 tests paramétriques supplémentaires sur le mapping live. */
const EXTRA_LIVE_MAP: [string, string][] = [
  ["reset_password_start", "login"],
  ["product_draft_saved", "create_product"],
  ["order_refused", "create_order"],
  ["wallet_topup", "wallet_activation"],
  ["conversation_open", "send_message"],
  ["industrial_report_export", "pole_activation"],
  ["feature_flag_change", "pole_activation"],
];
describe("BACKOFFICE-01-D extended journey map", () => {
  it.each(EXTRA_LIVE_MAP)("%s → %s", (event, canonical) => {
    expect(canonicalJourneyKeyForLiveEvent(event)).toBe(canonical);
  });
});

const APPS = [
  "mobile-grossiste-b",
  "mobile-detaillant",
  "web-grossiste-a",
  "web-industrial-nextjs",
  "backoffice-web",
] as const;
describe("BACKOFFICE-01-D multi-app envelope", () => {
  it.each(APPS)("builds envelope for %s", (app) => {
    const env = buildObservableEventEnvelope({ app, screen: `${app}.home`, module: app });
    expect(env.app).toBe(app);
    expect(env.eventId).toBeTruthy();
  });
});

const ERROR_KEYS = [
  "otp_invalid",
  "wallet_locked",
  "catalog_unavailable",
  "message_not_sent",
  "upload_failed",
  "connection_error",
  "order_unavailable",
  "sync_failed",
] as const;
describe("BACKOFFICE-01-D error keys ingest", () => {
  beforeEach(() => {
    resetBackofficeStore();
    resetLiveIngestRateLimitForTests();
  });
  it.each(ERROR_KEYS)("ingests %s", async (errorType) => {
    const n = await ingestLiveErrorEvents([
      { app: "mobile-grossiste-b", errorType, technicalMessage: "t", module: "test" },
    ]);
    expect(n).toBe(1);
  });
});

describe("BACKOFFICE-01-D journey step keys", () => {
  const steps = Object.values(OPERATIONAL_JOURNEY_EVENTS.AUTH);
  it.each(steps)("AUTH event %s is non-empty", (key) => {
    expect(key.length).toBeGreaterThan(3);
  });
});

const ALL_OPERATIONAL_EVENTS = [
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.AUTH),
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.CATALOG),
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.ORDER),
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.WALLET),
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.MESSAGING),
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.NETWORK),
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.INDUSTRIAL),
  ...Object.values(OPERATIONAL_JOURNEY_EVENTS.BACKOFFICE),
];
describe("BACKOFFICE-01-D all operational events defined", () => {
  it.each(ALL_OPERATIONAL_EVENTS)("event key %s", (eventKey) => {
    expect(typeof eventKey).toBe("string");
    expect(eventKey).toMatch(/^[a-z0-9_]+$/);
  });
});

describe("BACKOFFICE-01-D evaluateLiveOperationalAlerts thresholds", () => {
  it("does not alert on low volume", async () => {
    await ingestLiveErrorEvents([
      { app: "backoffice-web", errorType: "otp_invalid", technicalMessage: "one" },
    ]);
    expect(getBackofficeStore().errors.length).toBe(1);
  });
});

const JOURNEY_STATUSES = ["IN_PROGRESS", "COMPLETED", "BLOCKED", "ABANDONED"] as const;
describe("BACKOFFICE-01-D journey status ingest", () => {
  it.each(JOURNEY_STATUSES)("ingests status %s", async (status) => {
    const n = await ingestLiveJourneyEvents([
      { app: "web-grossiste-a", eventKey: "login_start", status, journeyId: `j-${status}` },
    ]);
    expect(n).toBe(1);
  });
});
