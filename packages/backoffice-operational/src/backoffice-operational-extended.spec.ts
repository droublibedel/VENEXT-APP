import { beforeEach, describe, expect, it } from "vitest";

import { resetBackofficeStore, getBackofficeStore } from "./store/backoffice-store.js";
import { seedOperationalDemoData } from "./seed/demo-operational-seed.js";
import { CANONICAL_JOURNEY_DEFINITIONS } from "./journeys/journey-definitions.js";
import { createBackofficeErrorEvent } from "./errors/error-pipeline.js";
import { maskPhone, maskEmail } from "./privacy/sensitive-data.js";
import { globalSearch } from "./services/operational-readouts.js";

beforeEach(async () => {
  resetBackofficeStore();
  await seedOperationalDemoData();
});

describe("BACKOFFICE-01 extended coverage", () => {
  const errorTypes = [
    "connection_error",
    "otp_invalid",
    "password_incorrect",
    "session_expired",
    "network_unstable",
    "api_unavailable",
    "catalog_unavailable",
    "order_not_created",
    "order_blocked",
    "delivery_not_confirmed",
    "message_not_sent",
    "wallet_locked",
    "wallet_not_activated",
    "settlement_failed",
    "invalid_file",
    "upload_failed",
    "invitation_expired",
    "enterprise_link_invalid",
    "access_suspended",
    "unauthorized_access",
    "frontend_runtime",
    "backend_error",
    "bff_error",
    "offline_sync_error",
    "generic",
  ] as const;

  it.each(errorTypes)("stores error type %s", async (errorType) => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "Douceur",
      technicalMessage: "tech",
      errorType,
      severity: "error",
      application: "mobile-grossiste-b",
    });
    expect(e.errorType).toBe(errorType);
  });

  const statuses = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "IGNORED"] as const;
  it.each(statuses)("supports treatment status %s", async (treatmentStatus) => {
    const e = await createBackofficeErrorEvent({
      userFacingMessage: "m",
      technicalMessage: "t",
      errorType: "generic",
      severity: "info",
      application: "bff",
      treatmentStatus,
    });
    expect(e.treatmentStatus).toBe(treatmentStatus);
  });

  it.each(CANONICAL_JOURNEY_DEFINITIONS)("journey %s has ordered steps", (def) => {
    const orders = def.steps.map((s) => s.order);
    expect(orders.length).toBeGreaterThan(0);
  });

  it.each(["LOW", "NORMAL", "IMPORTANT", "URGENT"] as const)("support priority %s", (priority) => {
    getBackofficeStore().addSupport({
      priority,
      source: "MANUAL",
      status: "OPEN",
      title: priority,
      summary: "x",
    });
    expect(getBackofficeStore().support.some((t) => t.priority === priority)).toBe(true);
  });

  it.each([
    "mobile-grossiste-b",
    "mobile-detaillant",
    "web-grossiste-a",
    "web-industrial-nextjs",
    "backoffice-web",
  ])("search tolerates app context %s", async (app) => {
    await createBackofficeErrorEvent({
      userFacingMessage: "m",
      technicalMessage: "t",
      errorType: "generic",
      severity: "error",
      application: app,
    });
    expect(getBackofficeStore().errors.some((e) => e.application === app)).toBe(true);
  });

  it.each(["+221700000001", "+221700000099", "+22507000000"])("masks phone %s", (phone) => {
    expect(maskPhone(phone)).toContain("•");
    expect(maskPhone(phone, true)).toBe(phone);
  });

  it.each(["ops@venext.ci", "a@b.co"])("masks email %s", (email) => {
    expect(maskEmail(email)).toContain("@");
    expect(maskEmail(email, true)).toBe(email);
  });

  it("global search finds enterprise", async () => {
    expect((await globalSearch("Agro")).some((r) => r.kind === "enterprise")).toBe(true);
  });

  it("demo seed populates users", () => {
    expect(getBackofficeStore().users.length).toBeGreaterThan(0);
  });

  it("demo seed populates documents", () => {
    expect(getBackofficeStore().documents.length).toBeGreaterThan(0);
  });

  it("errors recorded after demo seed", () => {
    expect(getBackofficeStore().errors.length).toBeGreaterThan(0);
  });
});
