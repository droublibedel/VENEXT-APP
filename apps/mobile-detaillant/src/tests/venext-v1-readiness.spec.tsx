import { describe, expect, it } from "vitest";

import {
  auditFinalFeatureFlags,
  buildVenextProductionReadiness,
  isV1ActorSurface,
} from "venext-v1-readiness";

const FLAGS = {
  detaillant_mobile_enabled: true,
  venext_i18n_enabled: true,
  commerce_notifications_enabled: true,
  commerce_offline_foundation_enabled: true,
  venext_bff_routes_enabled: true,
};

describe("VENEXT V1 readiness — détaillant mobile", () => {
  it("detaillant is V1 actor", () => {
    expect(isV1ActorSurface("detaillant")).toBe(true);
  });

  it("readiness with wallet offline", () => {
    const r = buildVenextProductionReadiness({
      flags: FLAGS,
      walletSecured: true,
      offlinePaymentBlocked: true,
    });
    expect(r.philosophyOk).toBe(true);
  });

  it("terrain flag audit", () => {
    expect(auditFinalFeatureFlags(FLAGS, { surface: "terrain" }).ok).toBe(true);
  });
});
