import { describe, expect, it } from "vitest";

import { COMMERCE_OFFLINE_SYNC_POLLING_MS } from "commerce-offline-foundation";
import { COMMERCE_NOTIFICATIONS_POLLING_MS } from "commerce-notifications";
import {
  auditFinalFeatureFlags,
  auditVenextPhilosophyCopy,
  buildVenextProductionReadiness,
} from "venext-v1-readiness";

const TERRAIN_FLAGS = {
  grossiste_b_mobile_enabled: true,
  detaillant_mobile_enabled: true,
  venext_auth_foundation_enabled: true,
  venext_i18n_enabled: true,
  commerce_foundation_guardrails_enabled: true,
  commerce_notifications_enabled: true,
  commercial_activity_feed_enabled: true,
  commerce_offline_foundation_enabled: true,
  commerce_access_control_enabled: true,
  commercial_context_routing_enabled: true,
  venext_bff_routes_enabled: true,
  commerce_ux_harmony_enabled: true,
  commerce_performance_foundation_enabled: true,
};

describe("VENEXT V1 readiness — grossiste B mobile", () => {
  it("production readiness ready", () => {
    const r = buildVenextProductionReadiness({
      flags: TERRAIN_FLAGS,
      walletSecured: true,
      offlinePaymentBlocked: true,
      pollingMs: 0,
    });
    expect(r.ready).toBe(true);
    expect(r.v1Frozen).toBe(true);
  });

  it("no notification polling", () => {
    expect(COMMERCE_NOTIFICATIONS_POLLING_MS).toBe(0);
  });

  it("no offline sync polling", () => {
    expect(COMMERCE_OFFLINE_SYNC_POLLING_MS).toBe(0);
  });

  it("terrain flags audit", () => {
    expect(auditFinalFeatureFlags(TERRAIN_FLAGS, { surface: "terrain" }).ok).toBe(true);
  });

  it("commerce-first activity wording", () => {
    expect(auditVenextPhilosophyCopy("Activité partenaire aujourd'hui").ok).toBe(true);
  });

  it("rejects ERP wording", () => {
    expect(auditVenextPhilosophyCopy("Tableau de bord ERP").ok).toBe(false);
  });
});
