import { describe, expect, it } from "vitest";

import {
  auditFinalFeatureFlags,
  auditVenextPhilosophyCopy,
  buildVenextProductionReadiness,
} from "venext-v1-readiness";

const FLAGS = {
  grossiste_a_web_enabled: true,
  venext_i18n_enabled: true,
  commerce_notifications_enabled: true,
  commercial_activity_feed_enabled: true,
  commercial_context_routing_enabled: true,
  venext_bff_routes_enabled: true,
  professional_commercial_network_enabled: true,
};

describe("VENEXT V1 readiness — grossiste A web", () => {
  it("formal web readiness", () => {
    const r = buildVenextProductionReadiness({ flags: FLAGS, hasBffRoutes: true });
    expect(r.webOk).toBe(true);
  });

  it("mail professional wording", () => {
    expect(auditVenextPhilosophyCopy("Mail professionnel partenaire").ok).toBe(true);
  });

  it("formal flag audit", () => {
    expect(auditFinalFeatureFlags(FLAGS, { surface: "formal" }).ok).toBe(true);
  });
});
