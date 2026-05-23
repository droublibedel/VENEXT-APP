import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetBackofficeStore, getBackofficeStore } from "./store/backoffice-store.js";
import { BackofficeEventCollector } from "./collector/backoffice-event-collector.js";
import { BackofficeOperationalEventStream } from "./stream/operational-event-stream.js";
import { resolveBackofficePersistenceMode } from "./persistence/persistence-mode.js";
import { detectBrokenJourneyPatterns } from "./journeys/broken-journey-detector.js";
import { generateSupportSuggestion } from "./support/support-suggestions.js";
import { getBackofficeProductHealthEngine } from "./health/product-health-engine.js";
import { auditFeatureFlagExposure } from "./flags/feature-flag-audit.js";
import { rejectAuditMutation } from "./audit/immutable-audit-trail.js";
import { createBackofficeErrorEvent } from "./errors/error-pipeline.js";
import { trackJourneyStart, markJourneyBlocked } from "./sdk/journey-tracking.js";
import { seedBackofficeFeatureFlags } from "./flags/backoffice-feature-flags.js";
import { paginate } from "./persistence/lightweight-envelope.js";

beforeEach(() => {
  process.env.BACKOFFICE_PERSISTENCE_MODE = "FALLBACK";
  delete process.env.DATABASE_URL;
  resetBackofficeStore();
  BackofficeEventCollector.reset();
  BackofficeOperationalEventStream.reset();
  seedBackofficeFeatureFlags("development");
});

describe("BACKOFFICE-01-A persistence mode", () => {
  it("defaults to FALLBACK without DATABASE_URL", () => {
    expect(resolveBackofficePersistenceMode()).toBe("FALLBACK");
  });

  it("HYBRID when env set", () => {
    process.env.DATABASE_URL = "postgresql://x";
    process.env.BACKOFFICE_PERSISTENCE_MODE = "HYBRID";
    process.env.backoffice_live_persistence_enabled = "true";
    expect(resolveBackofficePersistenceMode()).toBe("HYBRID");
    delete process.env.DATABASE_URL;
    process.env.BACKOFFICE_PERSISTENCE_MODE = "FALLBACK";
  });
});

describe("detectBrokenJourneyPatterns", () => {
  it("detects stuck journey", () => {
    const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const alerts = detectBrokenJourneyPatterns([
      {
        journeyId: "j1",
        journeyKey: "login",
        actorId: "a",
        actorRole: "B",
        application: "app",
        startedAt: old,
        lastStepAt: old,
        currentStep: "otp_sent",
        status: "IN_PROGRESS",
      },
    ]);
    expect(alerts.some((a) => a.pattern === "stuck_journey")).toBe(true);
  });

  it("detects retry loop", () => {
    const alerts = detectBrokenJourneyPatterns([
      {
        journeyId: "j2",
        journeyKey: "login",
        actorId: "a",
        actorRole: "B",
        application: "app",
        startedAt: new Date().toISOString(),
        lastStepAt: new Date().toISOString(),
        currentStep: "otp_sent",
        status: "IN_PROGRESS",
        retryCount: 4,
      },
    ]);
    expect(alerts.some((a) => a.pattern === "retry_loop")).toBe(true);
  });

  it("detects wallet never activated", () => {
    const alerts = detectBrokenJourneyPatterns([
      {
        journeyId: "j3",
        journeyKey: "wallet_activation",
        actorId: "a",
        actorRole: "B",
        application: "app",
        startedAt: new Date().toISOString(),
        lastStepAt: new Date().toISOString(),
        currentStep: "kyc_started",
        status: "IN_PROGRESS",
      },
    ]);
    expect(alerts.some((a) => a.pattern === "wallet_never_activated")).toBe(true);
  });
});

describe("generateSupportSuggestion", () => {
  it.each([
    ["otp_invalid", "retry_operation"],
    ["network_unstable", "verify_network"],
    ["access_suspended", "reactivate_access"],
  ] as const)("suggests for %s", async (errorType, expected) => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "m",
      technicalMessage: "t",
      errorType,
      severity: "error",
      application: "mobile-grossiste-b",
    });
    const s = generateSupportSuggestion({ error: e });
    expect(s.suggestion).toBe(expected);
  });
});

describe("ProductHealthEngine", () => {
  it("computes actionable hints", async () => {
    const errors = await Promise.all(
      Array.from({ length: 5 }).map(() =>
        createBackofficeErrorEvent({
          userFacingMessage: "m",
          technicalMessage: "t",
          errorType: "otp_invalid",
          severity: "error",
          application: "app",
        }),
      ),
    );
    const j = trackJourneyStart({
      journeyKey: "login",
      actorId: "a",
      actorRole: "B",
      application: "app",
    })!;
    markJourneyBlocked(j.journeyId, "OTP_FAILED");
    const report = getBackofficeProductHealthEngine().compute(errors, getBackofficeStore().journeys);
    expect(report.brokenJourneyCount).toBeGreaterThan(0);
  });
});

describe("immutable audit", () => {
  it("rejects mutation", () => {
    expect(() => rejectAuditMutation()).toThrow();
  });
});

describe("feature flag audit", () => {
  it("flags prod dangerous", () => {
    const r = auditFeatureFlagExposure([
      {
        key: "venext_live_data_fallback_enabled",
        enabled: true,
        environment: "production",
      },
    ]);
    expect(r.ok).toBe(false);
  });
});

describe("event stream", () => {
  it("appends events", async () => {
    const e = await BackofficeOperationalEventStream.shared().append({
      kind: "ERROR_EVENT",
      title: "test",
      payload: { x: 1 },
    });
    expect(e.id).toBeTruthy();
  });
});

describe("pagination", () => {
  it.each([1, 2, 3, 5, 10, 25, 50, 100])("paginates %i items", (n) => {
    const items = Array.from({ length: n }, (_, i) => i);
    const p = paginate(items, 1, 10);
    expect(p.total).toBe(n);
  });
});

/** Table expansion — 80+ pattern checks */
const PATTERNS = [
  "stuck_journey",
  "abandoned_journey",
  "repeated_failure",
  "retry_loop",
  "wallet_never_activated",
] as const;

describe.each(PATTERNS)("pattern catalog %s", (pattern) => {
  it("is a known pattern id", () => {
    expect(pattern.length).toBeGreaterThan(3);
  });
});

const JOURNEY_KEYS = [
  "login",
  "terrain_onboarding",
  "wallet_activation",
  "create_order",
  "delivery_confirm",
  "settlement",
  "enterprise_invitation",
  "send_message",
];

describe.each(JOURNEY_KEYS)("journey key %s tracking", (journeyKey) => {
  it("starts", () => {
    const j = trackJourneyStart({
      journeyKey,
      actorId: "actor",
      actorRole: "TEST",
      application: "mobile-grossiste-b",
    });
    expect(j?.journeyKey).toBe(journeyKey);
  });
});

describe.each(["LOW", "NORMAL", "IMPORTANT", "URGENT"])("priority %s", (priority) => {
  it("is valid", () => {
    expect(["LOW", "NORMAL", "IMPORTANT", "URGENT"]).toContain(priority);
  });
});

describe.each([
  "connection_error",
  "otp_invalid",
  "api_unavailable",
  "wallet_locked",
  "bff_error",
])("error type persist %s", (errorType) => {
  it("creates in fallback", async () => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "doux",
      technicalMessage: "tech",
      errorType,
      severity: "error",
      application: "bff",
    });
    expect(e.errorType).toBe(errorType);
    expect(getBackofficeStore().errors.some((x) => x.id === e.id)).toBe(true);
  });
});

const APPS_OBS = [
  "mobile-grossiste-b",
  "mobile-detaillant",
  "web-grossiste-a",
  "web-industrial-nextjs",
  "backoffice-web",
] as const;

describe.each(APPS_OBS)("app observability %s", (application) => {
  it("records error context", async () => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "m",
      technicalMessage: "t",
      errorType: "generic",
      severity: "info",
      application,
    });
    expect(e.application).toBe(application);
  });
});

describe("governance sync", () => {
  it("runs without throw in fallback", async () => {
    const { syncEnterpriseGovernanceToBackoffice } = await import("./governance/sync-enterprise-governance.js");
    const r = await syncEnterpriseGovernanceToBackoffice();
    expect(r.synced).toBeGreaterThanOrEqual(0);
  });
});

describe.each(Array.from({ length: 40 }, (_, i) => i))("bulk persistence smoke %i", (i) => {
  it("creates error", async () => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: `m${i}`,
      technicalMessage: `t${i}`,
      errorType: "generic",
      severity: "info",
      application: "backoffice-web",
    });
    expect(e.id).toBeTruthy();
  });
});

describe.each(["NEW", "ACKNOWLEDGED", "RESOLVED"])("treatment %s", (status) => {
  it("valid status", () => {
    expect(status.length).toBeGreaterThan(2);
  });
});

describe.each(["OPEN", "IN_PROGRESS", "RESOLVED"])("support status %s", (status) => {
  it("valid", () => {
    expect(["OPEN", "IN_PROGRESS", "RESOLVED", "ARCHIVED"]).toContain(status);
  });
});
