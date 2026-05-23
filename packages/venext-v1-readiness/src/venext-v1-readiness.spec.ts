import { describe, expect, it } from "vitest";

import {
  auditFinalFeatureFlags,
  auditVenextPhilosophyCopy,
  buildVenextProductionReadiness,
  isV1ActorSurface,
  VENEXT_V1_ACTOR_SURFACES,
  VENEXT_V1_EXCLUDED,
  VENEXT_V1_INCLUDED_MODULES,
  VENEXT_V1_LATER,
  VENEXT_V1_PRODUCTION_FLAG_KEYS,
} from "./index";

const DEV_FLAGS: Record<string, boolean> = {
  venext_auth_foundation_enabled: true,
  venext_i18n_enabled: true,
  commerce_foundation_guardrails_enabled: true,
  commerce_notifications_enabled: true,
  commercial_activity_feed_enabled: true,
  commerce_offline_foundation_enabled: true,
  commerce_access_control_enabled: true,
  commercial_context_routing_enabled: true,
  commerce_ux_harmony_enabled: true,
  commerce_performance_foundation_enabled: true,
  venext_bff_routes_enabled: true,
  grossiste_b_mobile_enabled: true,
  detaillant_mobile_enabled: true,
  grossiste_a_web_enabled: true,
  industrial_poles_enabled: true,
};

describe("venext-v1-readiness (20.86)", () => {
  describe("V1 freeze scope", () => {
    it("includes core modules", () => {
      expect(VENEXT_V1_INCLUDED_MODULES).toContain("commerce-wallet");
      expect(VENEXT_V1_INCLUDED_MODULES.length).toBeGreaterThan(10);
    });
    it("excludes social marketplace", () => {
      expect(VENEXT_V1_EXCLUDED.some((x) => x.includes("social"))).toBe(true);
    });
    it("later items documented", () => {
      expect(VENEXT_V1_LATER.length).toBeGreaterThan(0);
    });
    for (const actor of VENEXT_V1_ACTOR_SURFACES) {
      it(`actor ${actor} is V1`, () => {
        expect(isV1ActorSurface(actor)).toBe(true);
      });
    }
    it("rejects unknown actor", () => {
      expect(isV1ActorSurface("marketplace")).toBe(false);
    });
  });

  describe("philosophy audit", () => {
    it("accepts commerce-first copy", () => {
      expect(auditVenextPhilosophyCopy("Commande partenaire en cours").ok).toBe(true);
    });
    const forbidden = [
      "marketplace publique",
      "réseau social",
      "ERP dashboard",
      "fintech app",
      "super app",
      "supply chain enterprise",
      "websocket live",
    ];
    for (const term of forbidden) {
      it(`rejects ${term}`, () => {
        expect(auditVenextPhilosophyCopy(`Activer ${term}`).ok).toBe(false);
      });
    }
    it("rejects workflow pipeline combo", () => {
      expect(auditVenextPhilosophyCopy("workflow pipeline ticket").ok).toBe(false);
    });
  });

  describe("auditFinalFeatureFlags", () => {
    it("passes dev-like flags", () => {
      expect(auditFinalFeatureFlags(DEV_FLAGS).ok).toBe(true);
    });
    it("warns offline sync without foundation", () => {
      const r = auditFinalFeatureFlags({
        ...DEV_FLAGS,
        commerce_offline_foundation_enabled: false,
        commerce_offline_sync_enabled: true,
      });
      expect(r.ok).toBe(false);
    });
    it("warns activity timeline without feed", () => {
      const r = auditFinalFeatureFlags({
        ...DEV_FLAGS,
        commercial_activity_feed_enabled: false,
        commercial_activity_timeline_enabled: true,
      });
      expect(r.ok).toBe(false);
    });
    it("lists production keys", () => {
      expect(VENEXT_V1_PRODUCTION_FLAG_KEYS.length).toBeGreaterThan(8);
    });
    it("terrain context checks mobile", () => {
      const r = auditFinalFeatureFlags(
        { grossiste_b_mobile_enabled: false, detaillant_mobile_enabled: false },
        { surface: "terrain" },
      );
      expect(r.ok).toBe(false);
    });
  });

  describe("buildVenextProductionReadiness", () => {
    it("ready with defaults", () => {
      const r = buildVenextProductionReadiness({ flags: DEV_FLAGS });
      expect(r.v1Frozen).toBe(true);
      expect(r.score).toBeGreaterThanOrEqual(85);
      expect(r.ready).toBe(true);
    });
    it("philosophyOk true", () => {
      expect(buildVenextProductionReadiness({ flags: DEV_FLAGS }).philosophyOk).toBe(true);
    });
    it("mobileOk with terrain flags", () => {
      expect(buildVenextProductionReadiness({ flags: DEV_FLAGS }).mobileOk).toBe(true);
    });
    it("webOk with formal flags", () => {
      expect(buildVenextProductionReadiness({ flags: DEV_FLAGS }).webOk).toBe(true);
    });
    it("backendOk with bff", () => {
      expect(buildVenextProductionReadiness({ flags: DEV_FLAGS, hasBffRoutes: true }).backendOk).toBe(
        true,
      );
    });
    it("fails deep navigation", () => {
      const r = buildVenextProductionReadiness({ flags: DEV_FLAGS, navigationDepth: 4 });
      expect(r.checks.find((c) => c.id === "navigation-depth")?.ok).toBe(false);
    });
    it("no polling check", () => {
      const r = buildVenextProductionReadiness({ flags: DEV_FLAGS, pollingMs: 0 });
      expect(r.checks.find((c) => c.id === "no-polling")?.ok).toBe(true);
    });
    it("rejects polling", () => {
      const r = buildVenextProductionReadiness({ flags: DEV_FLAGS, pollingMs: 5000 });
      expect(r.checks.find((c) => c.id === "no-polling")?.ok).toBe(false);
    });
    it("wallet secured", () => {
      const r = buildVenextProductionReadiness({
        flags: DEV_FLAGS,
        walletSecured: true,
        offlinePaymentBlocked: true,
      });
      expect(r.checks.find((c) => c.id === "wallet-secured")?.ok).toBe(true);
      expect(r.checks.find((c) => c.id === "offline-no-payment")?.ok).toBe(true);
    });
    it("i18n four locales", () => {
      const r = buildVenextProductionReadiness({
        flags: DEV_FLAGS,
        i18nLocales: ["fr-CI", "en", "ar", "zh-CN"],
      });
      expect(r.checks.find((c) => c.id === "i18n-locales")?.ok).toBe(true);
    });
  });

  describe("smoke flows", () => {
    it("notifications flow flags", () => {
      const r = buildVenextProductionReadiness({
        flags: { ...DEV_FLAGS, commerce_notifications_enabled: true },
      });
      expect(r.ready).toBe(true);
    });
    it("offline flow flags", () => {
      const r = buildVenextProductionReadiness({
        flags: {
          ...DEV_FLAGS,
          commerce_offline_foundation_enabled: true,
          commerce_offline_sync_enabled: true,
        },
      });
      expect(r.ready).toBe(true);
    });
    it("access control flow", () => {
      const r = buildVenextProductionReadiness({
        flags: { ...DEV_FLAGS, commerce_access_control_enabled: true },
      });
      expect(r.ready).toBe(true);
    });
    it("routing flow", () => {
      const r = buildVenextProductionReadiness({
        flags: { ...DEV_FLAGS, commercial_context_routing_enabled: true },
      });
      expect(r.ready).toBe(true);
    });
    it("fallback flow bff off", () => {
      const r = buildVenextProductionReadiness({
        flags: DEV_FLAGS,
        hasBffRoutes: false,
      });
      expect(r.checks.find((c) => c.id === "bff-routes")?.severity).toBe("warning");
    });
    it("low connectivity offline only", () => {
      const r = buildVenextProductionReadiness({
        flags: DEV_FLAGS,
        offlinePaymentBlocked: true,
        pollingMs: 0,
      });
      expect(r.ready).toBe(true);
    });
  });

  describe("actor surfaces", () => {
    const modules = [
      "catalogues relationnels",
      "commandes",
      "livraisons",
      "règlements",
      "notifications",
      "activity feed",
    ];
    for (const m of modules) {
      it(`wording ok for ${m}`, () => {
        expect(auditVenextPhilosophyCopy(`${m} partenaire`).ok).toBe(true);
      });
    }
  });

  describe("production readiness score", () => {
    it("score between 0 and 100", () => {
      const r = buildVenextProductionReadiness({ flags: {} });
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    });
    it("checks array non empty", () => {
      expect(buildVenextProductionReadiness({ flags: DEV_FLAGS }).checks.length).toBeGreaterThan(8);
    });
  });

  describe("V1 production flag keys", () => {
    for (const key of VENEXT_V1_PRODUCTION_FLAG_KEYS) {
      it(`declares ${key}`, () => {
        expect(key.length).toBeGreaterThan(5);
      });
    }
  });

  describe("included modules registry", () => {
    for (const mod of VENEXT_V1_INCLUDED_MODULES) {
      it(`module ${mod} in V1`, () => {
        expect(mod).not.toMatch(/experimental/);
      });
    }
  });

  describe("wallet secured flow smoke", () => {
    it("wallet check passes when secured", () => {
      const r = buildVenextProductionReadiness({ flags: DEV_FLAGS, walletSecured: true });
      expect(r.checks.find((c) => c.id === "wallet-secured")?.ok).toBe(true);
    });
    it("wallet fails when not secured", () => {
      const r = buildVenextProductionReadiness({ flags: DEV_FLAGS, walletSecured: false });
      expect(r.checks.find((c) => c.id === "wallet-secured")?.ok).toBe(false);
    });
  });

  describe("i18n flow", () => {
    for (const locale of ["fr-CI", "en", "ar", "zh-CN"]) {
      it(`locale ${locale} in readiness`, () => {
        const r = buildVenextProductionReadiness({
          flags: DEV_FLAGS,
          i18nLocales: ["fr-CI", "en", "ar", "zh-CN"],
        });
        expect(r.checks.find((c) => c.id === "i18n-locales")?.ok).toBe(true);
      });
    }
  });

  describe("anti patterns", () => {
    const anti = ["ticket ERP", "dashboard bancaire", "engagement social", "ranking public"];
    for (const phrase of anti) {
      it(`blocks ${phrase}`, () => {
        expect(auditVenextPhilosophyCopy(phrase).ok).toBe(false);
      });
    }
  });
});
