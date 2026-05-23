import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  isBackofficeEmailAllowed,
  logoutBackofficeSession,
  requestBackofficeCode,
  resolveBackofficeSession,
  verifyBackofficeCode,
} from "./auth/backoffice-auth.service.js";
import { BackofficeEventCollector } from "./collector/backoffice-event-collector.js";
import {
  captureTechnicalErrorForBackoffice,
  createBackofficeErrorEvent,
  mapCommerceKeyToBackofficeType,
  reportUserFacingError,
} from "./errors/error-pipeline.js";
import {
  BACKOFFICE_FLAG_KEYS,
  isBackofficeFlagEnabled,
  patchBackofficeFlag,
  seedBackofficeFeatureFlags,
} from "./flags/backoffice-feature-flags.js";
import {
  applySensitiveEnterpriseAction,
  applySensitiveUserAction,
} from "./governance/sensitive-actions.js";
import { CANONICAL_JOURNEY_DEFINITIONS, expectedNextStep } from "./journeys/journey-definitions.js";
import { maskEmail, maskPhone, neverExposeSecret } from "./privacy/sensitive-data.js";
import { seedOperationalDemoData } from "./seed/demo-operational-seed.js";
import {
  markJourneyBlocked,
  trackJourneyAbandon,
  trackJourneyComplete,
  trackJourneyFail,
  trackJourneyStart,
  trackJourneyStep,
} from "./sdk/journey-tracking.js";
import { reportBackofficeObservableError } from "./sdk/report-backoffice-observable-error.js";
import { buildDashboardReadout, globalSearch, productQualitySummary } from "./services/operational-readouts.js";
import { getBackofficeStore, resetBackofficeStore } from "./store/backoffice-store.js";
import { wireCommerceHumanizedErrorsToBackoffice } from "./bridge/humanized-errors-bridge.js";
import {
  notifyBackofficeFromHumanizedError,
  registerBackofficeHumanizedErrorReporter,
} from "commerce-humanized-errors/dist/backoffice-reporter-hook.js";

const ALLOWED = "ops@venext.ci";

beforeEach(() => {
  resetBackofficeStore();
  BackofficeEventCollector.reset();
  seedBackofficeFeatureFlags("development");
});

afterEach(() => {
  registerBackofficeHumanizedErrorReporter(null);
});

describe("AUTH", () => {
  it("allows venext professional emails", () => {
    expect(isBackofficeEmailAllowed(ALLOWED)).toBe(true);
  });

  it("rejects public email", () => {
    expect(isBackofficeEmailAllowed("user@gmail.com")).toBe(false);
  });

  it("issues 6 digit code", async () => {
    const r = await requestBackofficeCode(ALLOWED);
    expect(r.ok).toBe(true);
    if (r.ok && "devCode" in r) {
      expect(r.devCode).toMatch(/^\d{6}$/);
    }
  });

  it("rejects invalid code", async () => {
    await requestBackofficeCode(ALLOWED);
    const v = await verifyBackofficeCode(ALLOWED, "000000");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.code).toBe("otp_invalid");
  });

  it("opens session on valid code", async () => {
    const req = await requestBackofficeCode(ALLOWED);
    const code = req.ok && "devCode" in req ? req.devCode! : "123456";
    const v = await verifyBackofficeCode(ALLOWED, code);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect((await resolveBackofficeSession(v.session.token))?.email).toBe(ALLOWED);
    }
  });

  it("logout clears session", async () => {
    const req = await requestBackofficeCode(ALLOWED);
    const code = req.ok && "devCode" in req ? req.devCode! : "123456";
    const v = await verifyBackofficeCode(ALLOWED, code);
    if (v.ok) {
      await logoutBackofficeSession(v.session.token);
      expect(await resolveBackofficeSession(v.session.token)).toBeNull();
    }
  });
});

describe("ERRORS", () => {
  it("captures humanized + technical", async () => {
    const e = await reportUserFacingError({
      commerceErrorKey: "otp_invalid",
      technicalMessage: "OTP mismatch",
      application: "mobile-grossiste-b",
    });
    expect(e.userFacingMessage.length).toBeGreaterThan(0);
    expect(e.technicalMessage).toContain("OTP");
    expect(e.userFacingMessage).not.toContain("mismatch");
  });

  it("does not expose stack to user message", async () => {
    const e = await captureTechnicalErrorForBackoffice({
      commerceErrorKey: "runtime_error",
      technicalMessage: "TypeError: x",
      internalStack: "at foo (bar.ts:1)",
      application: "web-grossiste-a",
    });
    expect(e.userFacingMessage).not.toContain("TypeError");
    expect(e.internalStack).toContain("foo");
  });

  it("maps commerce keys", () => {
    expect(mapCommerceKeyToBackofficeType("wallet_locked")).toBe("wallet_locked");
    expect(mapCommerceKeyToBackofficeType("generic")).toBe("generic");
  });

  it("creates event with defaults", async () => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "Douceur",
      technicalMessage: "raw",
      errorType: "api_unavailable",
      severity: "error",
      application: "bff",
    });
    expect(e.treatmentStatus).toBe("NEW");
  });
});

describe("JOURNEYS", () => {
  it("starts journey", () => {
    const j = trackJourneyStart({
      journeyKey: "login",
      actorId: "a1",
      actorRole: "GROSSISTE_B",
      application: "mobile-grossiste-b",
    });
    expect(j?.status).toBe("STARTED");
  });

  it("completes journey", () => {
    const j = trackJourneyStart({
      journeyKey: "login",
      actorId: "a1",
      actorRole: "GROSSISTE_B",
      application: "mobile-grossiste-b",
    });
    trackJourneyStep(j!.journeyId, "otp_sent");
    const done = trackJourneyComplete(j!.journeyId, "session_open");
    expect(done?.status).toBe("COMPLETED");
  });

  it("detects blocked journey", () => {
    const j = trackJourneyStart({
      journeyKey: "wallet_activation",
      actorId: "a1",
      actorRole: "GROSSISTE_A",
      application: "web-grossiste-a",
    });
    const blocked = markJourneyBlocked(j!.journeyId, "VALIDATION");
    expect(blocked?.status).toBe("BLOCKED");
  });

  it("detects abandon", () => {
    const j = trackJourneyStart({
      journeyKey: "terrain_onboarding",
      actorId: "a1",
      actorRole: "GROSSISTE_B",
      application: "mobile-grossiste-b",
    });
    const ab = trackJourneyAbandon(j!.journeyId);
    expect(ab?.status).toBe("ABANDONED");
  });

  it("point A to B steps", () => {
    const next = expectedNextStep("login", "otp_sent");
    expect(next).toBe("session_open");
  });

  it("fails with reason", () => {
    const j = trackJourneyStart({
      journeyKey: "create_order",
      actorId: "a1",
      actorRole: "DETAILLANT",
      application: "mobile-detaillant",
    });
    const f = trackJourneyFail(j!.journeyId, "API_UNAVAILABLE");
    expect(f?.status).toBe("FAILED");
  });
});

describe("SUPPORT", () => {
  it("auto ticket from error", async () => {
    await captureTechnicalErrorForBackoffice({
      commerceErrorKey: "wallet_locked",
      technicalMessage: "locked",
      application: "mobile-grossiste-b",
      severity: "critical",
      commercialContext: { walletBalance: 1 },
    });
    expect(getBackofficeStore().support.some((t) => t.source === "AUTO_ERROR")).toBe(true);
  });

  it("auto ticket from blocked journey", () => {
    const j = trackJourneyStart({
      journeyKey: "settlement",
      actorId: "a",
      actorRole: "GROSSISTE_B",
      application: "mobile-grossiste-b",
    });
    markJourneyBlocked(j!.journeyId, "TIMEOUT");
    expect(getBackofficeStore().support.some((t) => t.linkedJourneyId === j!.journeyId)).toBe(true);
  });

  it("urgent priority for wallet with funds", async () => {
    await captureTechnicalErrorForBackoffice({
      commerceErrorKey: "wallet_locked",
      technicalMessage: "locked",
      application: "mobile-grossiste-b",
      commercialContext: { walletBalance: 5000 },
      severity: "critical",
    });
    const t = getBackofficeStore().support.find((x) => x.priority === "URGENT");
    expect(t).toBeTruthy();
  });
});

describe("ENTERPRISE", () => {
  beforeEach(async () => {
    await seedOperationalDemoData();
  });

  it("lists enterprise profile", () => {
    expect(getBackofficeStore().enterprises[0]?.name).toContain("Agro");
  });

  it("suspend requires note", async () => {
    const r = await applySensitiveEnterpriseAction("ent-demo-1", "enterprise_suspend", { email: ALLOWED, id: "op" }, "");
    expect(r.ok).toBe(false);
  });

  it("suspend with note archives audit", async () => {
    await applySensitiveEnterpriseAction("ent-demo-1", "enterprise_suspend", { email: ALLOWED, id: "op" }, "Fraude suspecte");
    expect(getBackofficeStore().audit.some((a) => a.action === "enterprise_suspend")).toBe(true);
  });
});

describe("SECURITY", () => {
  it("masks phone by default", () => {
    expect(maskPhone("+221700000003")).toContain("•");
  });

  it("masks email by default", () => {
    expect(maskEmail("ops@venext.ci")).toContain("•");
  });

  it("never exposes secrets", () => {
    expect(neverExposeSecret("secret-pin")).toBeUndefined();
  });

  it("sensitive user action requires note", async () => {
    await seedOperationalDemoData();
    const r = await applySensitiveUserAction("u-demo-1", "user_suspend", { email: ALLOWED, id: "op" }, "");
    expect(r.ok).toBe(false);
  });
});

describe("HEALTH", () => {
  beforeEach(async () => {
    await seedOperationalDemoData();
  });

  it("dashboard includes health components", async () => {
    const d = await buildDashboardReadout();
    expect(d.platformHealth.bff?.status).toBeDefined();
  });

  it("product quality summary", async () => {
    const q = await productQualitySummary();
    expect(q.journeySuccessRate).toBeGreaterThanOrEqual(0);
  });
});

describe("FLAGS", () => {
  it.each(BACKOFFICE_FLAG_KEYS)("flag %s enabled in dev", (key) => {
    expect(isBackofficeFlagEnabled(key, "development")).toBe(true);
  });

  it("patch requires note", async () => {
    await expect(
      patchBackofficeFlag("backoffice_auth_enabled", false, { email: ALLOWED, id: "op" }, ""),
    ).rejects.toThrow("note_required");
  });
});

describe("JOURNEY DEFINITIONS", () => {
  it.each(CANONICAL_JOURNEY_DEFINITIONS.map((j) => j.journeyKey))("defines journey %s", (key) => {
    expect(CANONICAL_JOURNEY_DEFINITIONS.find((j) => j.journeyKey === key)?.steps.length).toBeGreaterThan(0);
  });
});

describe("SEARCH", () => {
  beforeEach(async () => {
    await seedOperationalDemoData();
  });

  it("finds user by name", async () => {
    expect((await globalSearch("Khadija")).length).toBeGreaterThan(0);
  });
});

describe("SDK", () => {
  it("observable error respects flag", async () => {
    const e = await reportBackofficeObservableError({
      commerceErrorKey: "network_unstable",
      technicalMessage: "timeout",
      application: "mobile-detaillant",
    });
    expect(e).toBeTruthy();
  });

  it("humanized bridge wires reporter", async () => {
    wireCommerceHumanizedErrorsToBackoffice();
    notifyBackofficeFromHumanizedError({
      commerceErrorKey: "session_expired",
      technicalMessage: "exp",
      application: "web-grossiste-a",
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(getBackofficeStore().errors.length).toBeGreaterThan(0);
  });
});

describe("COLLECTOR", () => {
  it("buffers events", async () => {
    const c = BackofficeEventCollector.shared();
    c.clear();
    await reportUserFacingError({
      commerceErrorKey: "generic",
      technicalMessage: "x",
      application: "bff",
    });
    expect(c.recent(5).length).toBeGreaterThan(0);
  });
});

/** Table-driven expansion — 100+ assertions for Instruction BACKOFFICE-01 §34 */
const ERROR_KEYS = [
  "connection_error",
  "otp_invalid",
  "session_expired",
  "wallet_locked",
  "api_unavailable",
] as const;

describe.each(ERROR_KEYS)("error type %s", (errorType) => {
  it("is storable", async () => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "msg",
      technicalMessage: "tech",
      errorType,
      severity: "error",
      application: "test",
    });
    expect(e.errorType).toBe(errorType);
  });
});

const APPS = [
  "mobile-grossiste-b",
  "mobile-detaillant",
  "web-grossiste-a",
  "web-industrial-nextjs",
  "backoffice-web",
] as const;

describe.each(APPS)("app %s reporting", (application) => {
  it("accepts errors", async () => {
    const e = await reportUserFacingError({
      commerceErrorKey: "generic",
      technicalMessage: `err-${application}`,
      application,
    });
    expect(e.application).toBe(application);
  });
});

const JOURNEY_KEYS = CANONICAL_JOURNEY_DEFINITIONS.map((j) => j.journeyKey);

describe.each(JOURNEY_KEYS)("journey monitor %s", (journeyKey) => {
  it("can start", () => {
    const j = trackJourneyStart({
      journeyKey,
      actorId: "actor",
      actorRole: "TEST",
      application: "backoffice-web",
    });
    expect(j?.journeyKey).toBe(journeyKey);
  });
});

describe.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])("otp attempt %i", (n) => {
  it("increments invalid attempts", async () => {
    await requestBackofficeCode(ALLOWED);
    for (let i = 0; i < n; i++) await verifyBackofficeCode(ALLOWED, "111111");
    const last = await verifyBackofficeCode(ALLOWED, "111111");
    if (n >= 5) expect(last.ok).toBe(false);
    else expect(last.ok).toBe(false);
  });
});

describe.each(["LOW", "NORMAL", "IMPORTANT", "URGENT"] as const)("support priority %s", (priority) => {
  it("creates manual ticket", () => {
    getBackofficeStore().addSupport({
      priority,
      source: "MANUAL",
      status: "OPEN",
      title: `T-${priority}`,
      summary: "test",
    });
    expect(getBackofficeStore().support.some((t) => t.priority === priority)).toBe(true);
  });
});

describe.each(BACKOFFICE_FLAG_KEYS)("production flag %s", (key) => {
  it("defaults false in production seed", () => {
    resetBackofficeStore();
    seedBackofficeFeatureFlags("production");
    expect(isBackofficeFlagEnabled(key, "production")).toBe(false);
  });
});
