import { describe, expect, it } from "vitest";

import {
  auditVenextPhilosophyCopy,
  buildVenextProductionReadiness,
  isV1ActorSurface,
} from "venext-v1-readiness";

const FLAGS = {
  industrial_poles_enabled: true,
  venext_i18n_enabled: true,
  commerce_notifications_enabled: true,
  commercial_activity_feed_enabled: true,
  venext_bff_routes_enabled: true,
  producer_partner_network_enabled: true,
};

describe("VENEXT V1 readiness — producteur web", () => {
  it("producteur is V1 actor", () => {
    expect(isV1ActorSurface("producteur")).toBe(true);
  });

  it("producer readiness", () => {
    const r = buildVenextProductionReadiness({ flags: FLAGS, navigationDepth: 2 });
    expect(r.philosophyOk).toBe(true);
  });

  it("no supply chain enterprise UI", () => {
    expect(auditVenextPhilosophyCopy("supply chain enterprise dashboard").ok).toBe(false);
  });
});
