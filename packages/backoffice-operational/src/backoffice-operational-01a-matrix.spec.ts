import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetBackofficeStore, getBackofficeStore } from "./store/backoffice-store.js";
import { createBackofficeErrorEvent } from "./errors/error-pipeline.js";
import { trackJourneyStart, markJourneyBlocked } from "./sdk/journey-tracking.js";
import { evaluateAutomaticAlerts } from "./alerts/automatic-alerts.js";
import { runBackofficeOperationalHealthCheck } from "./health/operational-health-check.js";
import { attachJourneyContextToError } from "./journeys/attach-journey-context.js";
import { getBackofficeErrorRepository } from "./repositories/backoffice-error.repository.js";
import { getBackofficeJourneyRepository } from "./repositories/backoffice-journey.repository.js";
import { getBackofficeSupportRepository } from "./repositories/backoffice-support.repository.js";
import { getBackofficeAuditRepository } from "./repositories/backoffice-audit.repository.js";
import { getBackofficeInternalNotificationRepository } from "./repositories/backoffice-internal-notification.repository.js";
import { immutableBackofficeAuditTrail, rejectAuditMutation } from "./audit/immutable-audit-trail.js";
import { lightweightListEnvelope, paginate } from "./persistence/lightweight-envelope.js";
import { maskEmail, maskPhone } from "./privacy/sensitive-data.js";
import { seedBackofficeFeatureFlags } from "./flags/backoffice-feature-flags.js";

beforeEach(() => {
  process.env.BACKOFFICE_PERSISTENCE_MODE = "FALLBACK";
  delete process.env.DATABASE_URL;
  resetBackofficeStore();
  seedBackofficeFeatureFlags("development");
});

afterEach(() => {
  resetBackofficeStore();
});

describe("BACKOFFICE-01-A matrix — automatic alerts", () => {
  it("fires login error spike", async () => {
    const errors = await Promise.all(
      Array.from({ length: 12 }).map(() =>
        createBackofficeErrorEvent({
          userFacingMessage: "m",
          technicalMessage: "t",
          errorType: "connection_error",
          severity: "error",
          application: "mobile-grossiste-b",
        }),
      ),
    );
    const alerts = await evaluateAutomaticAlerts({ errors, journeys: [] });
    expect(alerts.some((a) => a.code === "login_error_spike")).toBe(true);
  });

  it("fires otp invalid spike", async () => {
    const errors = await Promise.all(
      Array.from({ length: 9 }).map(() =>
        createBackofficeErrorEvent({
          userFacingMessage: "m",
          technicalMessage: "t",
          errorType: "otp_invalid",
          severity: "error",
          application: "mobile-grossiste-b",
        }),
      ),
    );
    const alerts = await evaluateAutomaticAlerts({ errors, journeys: [] });
    expect(alerts.some((a) => a.code === "otp_invalid_spike")).toBe(true);
  });

  it("fires broken journey spike", async () => {
    const journeys = Array.from({ length: 6 }).map((_, i) => {
      const j = trackJourneyStart({
        journeyKey: "login",
        actorId: `a${i}`,
        actorRole: "B",
        application: "app",
      })!;
      markJourneyBlocked(j.journeyId, "OTP_FAILED");
      return getBackofficeStore().findJourney(j.journeyId)!;
    });
    const alerts = await evaluateAutomaticAlerts({ errors: [], journeys });
    expect(alerts.some((a) => a.code === "broken_journey_spike")).toBe(true);
  });

  it("fires wallet failure spike", async () => {
    const errors = await Promise.all(
      Array.from({ length: 4 }).map(() =>
        createBackofficeErrorEvent({
          userFacingMessage: "m",
          technicalMessage: "t",
          errorType: "wallet_locked",
          severity: "critical",
          application: "mobile-grossiste-b",
        }),
      ),
    );
    const alerts = await evaluateAutomaticAlerts({ errors, journeys: [] });
    expect(alerts.some((a) => a.code === "wallet_failure_spike")).toBe(true);
  });

  it("fires excessive fallback", async () => {
    const alerts = await evaluateAutomaticAlerts({ errors: [], journeys: [], fallbackRate: 0.4 });
    expect(alerts.some((a) => a.code === "excessive_fallback")).toBe(true);
  });
});

describe("BACKOFFICE-01-A matrix — health check", () => {
  it("reports healthy when probes ok", async () => {
    const h = await runBackofficeOperationalHealthCheck({ bffOk: true, coreOk: true });
    expect(h.components.bff?.status).toBe("healthy");
    expect(h.components.core?.status).toBe("healthy");
  });

  it("reports degraded bff", async () => {
    const h = await runBackofficeOperationalHealthCheck({ bffOk: false, coreOk: true });
    expect(h.components.bff?.status).toBe("down");
  });

  it("reports degraded database in fallback", async () => {
    const h = await runBackofficeOperationalHealthCheck();
    expect(h.components.database?.status).toBe("degraded");
  });
});

describe("BACKOFFICE-01-A matrix — journey context", () => {
  it("enriches error with journey metadata", async () => {
    const j = trackJourneyStart({
      journeyKey: "create_order",
      actorId: "actor-1",
      actorRole: "GROSSISTE_B",
      application: "mobile-grossiste-b",
      userId: "u-1",
    })!;
    const err = await createBackofficeErrorEvent({
      userFacingMessage: "m",
      technicalMessage: "t",
      errorType: "order_not_created",
      severity: "error",
      application: "mobile-grossiste-b",
    });
    const enriched = await attachJourneyContextToError(err, j.journeyId);
    expect(enriched.commercialContext.journeyKey).toBe("create_order");
    expect(enriched.userId).toBe("u-1");
  });
});

describe("BACKOFFICE-01-A matrix — repositories fallback", () => {
  it("lists errors paginated", async () => {
    await createBackofficeErrorEvent({
      userFacingMessage: "m",
      technicalMessage: "t",
      errorType: "generic",
      severity: "info",
      application: "backoffice-web",
    });
    const page = await getBackofficeErrorRepository().list({ page: 1, pageSize: 10 });
    expect(page.items.length).toBeGreaterThan(0);
  });

  it("lists journeys paginated", async () => {
    trackJourneyStart({
      journeyKey: "login",
      actorId: "a",
      actorRole: "B",
      application: "app",
    });
    const page = await getBackofficeJourneyRepository().list({ page: 1, pageSize: 10 });
    expect(page.total).toBeGreaterThan(0);
  });

  it("appends audit immutably", async () => {
    const entry = await immutableBackofficeAuditTrail({
      actorEmail: "ops@venext.ci",
      actorId: "op-1",
      action: "test_action",
      targetType: "user",
      targetId: "u-1",
      note: "test",
    });
    expect(entry.action).toBe("test_action");
    const listed = await getBackofficeAuditRepository().list({ pageSize: 5 });
    expect(listed.items.some((i) => i.id === entry.id)).toBe(true);
  });

  it("rejects audit mutation", () => {
    expect(() => rejectAuditMutation()).toThrow();
  });

  it("pushes internal notification", async () => {
    await getBackofficeInternalNotificationRepository().push({
      priority: "high",
      title: "Test alerte",
      body: "corps",
    });
    const list = await getBackofficeInternalNotificationRepository().list({ pageSize: 5 });
    expect(list.items.length).toBeGreaterThan(0);
  });
});

describe("BACKOFFICE-01-A matrix — lightweight envelope", () => {
  it("wraps paginated payload", () => {
    const env = lightweightListEnvelope(paginate([1, 2, 3], 1, 2), "fallback");
    expect(env.dataSource).toBe("FALLBACK");
    expect(env.payload).toEqual([1, 2]);
    expect(env.pagination.total).toBe(3);
  });
});

describe.each([
  "mobile-grossiste-b",
  "mobile-detaillant",
  "web-grossiste-a",
  "web-industrial-nextjs",
  "backoffice-web",
])("masking per app %s", (app) => {
  it("masks phone", () => {
    expect(maskPhone("+221700000001")).toContain("•");
  });

  it("masks email", () => {
    expect(maskEmail("ops@venext.ci")).toContain("•");
  });

  it("stores error for app", async () => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "m",
      technicalMessage: "t",
      errorType: "generic",
      severity: "info",
      application: app as "mobile-grossiste-b",
    });
    expect(e.application).toBe(app);
  });
});

describe.each(["OPEN", "IN_PROGRESS", "RESOLVED"])("support repo status %s", (status) => {
  it("creates ticket", async () => {
    const ticket = await getBackofficeSupportRepository().create({
      title: `Ticket ${status}`,
      summary: "desc",
      priority: "NORMAL",
      status,
      source: "MANUAL",
    });
    expect(ticket.status).toBe(status);
  });
});

describe.each(Array.from({ length: 25 }, (_, i) => i))("persistence smoke batch %i", (i) => {
  it("persists error in memory", async () => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: `batch-${i}`,
      technicalMessage: "t",
      errorType: "generic",
      severity: "info",
      application: "backoffice-web",
    });
    expect(getBackofficeStore().errors.some((x) => x.id === e.id)).toBe(true);
  });
});
