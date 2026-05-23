import { describe, expect, it, beforeEach } from "vitest";

import {
  completeFormalAuth,
  completeTerrainAuth,
  createAuthSession,
  createInitialAuthState,
  logoutAuthState,
  MOCK_TERRAIN_OTP,
  refreshSessionLocally,
  requireAuthenticatedActor,
  requireFormalActor,
  requireTerrainActor,
  requireRelationshipPermission,
  hasPermission,
  validateTerrainPhone,
  validateTerrainOtp,
  validateFormalIdentifier,
  validateFormalPassword,
  maskPhoneNumber,
  isSessionExpired,
  validateSessionActor,
  redirectAuthenticatedActor,
  restoreLastWorkspace,
  restoreLastCommercialContext,
  clearAllAuthPersistence,
  persistAuthBundle,
  loadPersistedAuthBundle,
  readPersistedLocale,
  writePersistedLocale,
  assertActorMatch,
  isTerrainProfileComplete,
  normalizeTerrainProfile,
  rememberNavigationSnapshot,
  clearCommercialSession,
} from "./index";

describe("venext-auth-foundation (20.78)", () => {
  beforeEach(() => {
    clearAllAuthPersistence();
    clearCommercialSession();
  });

  describe("terrain auth", () => {
    it("validates phone length", () => {
      expect(validateTerrainPhone("+22507000000")).toBe(true);
      expect(validateTerrainPhone("123")).toBe(false);
    });

    it("validates mock OTP", () => {
      expect(validateTerrainOtp(MOCK_TERRAIN_OTP)).toBe(true);
      expect(validateTerrainOtp("000000")).toBe(false);
    });

    it("masks phone for display", () => {
      expect(maskPhoneNumber("+22507001234")).toMatch(/•••/);
      expect(maskPhoneNumber("+22507001234")).toMatch(/1234/);
    });

    it("completes terrain auth for GROSSISTE_B", () => {
      const state = completeTerrainAuth("GROSSISTE_B", {
        phone: "+22507000000",
        displayName: "Kofi Trade",
        city: "Abidjan",
        activities: ["Boissons"],
        otpVerified: true,
      });
      expect(state.status).toBe("authenticated");
      expect(state.profile?.kind).toBe("terrain");
      expect(isTerrainProfileComplete(state.profile as never)).toBe(true);
    });

    it("completes terrain auth for DETAILLANT", () => {
      const state = completeTerrainAuth("DETAILLANT", {
        phone: "+22501020304",
        displayName: "Boutique Aya",
        city: "Bouaké",
        activities: [],
        otpVerified: true,
      });
      expect(state.session?.actorRole).toBe("DETAILLANT");
    });
  });

  describe("formal auth", () => {
    it("validates email identifier", () => {
      expect(validateFormalIdentifier("contact@structure.ci")).toBe(true);
    });

    it("validates phone identifier", () => {
      expect(validateFormalIdentifier("+22507000000")).toBe(true);
    });

    it("validates password minimum", () => {
      expect(validateFormalPassword("secret12")).toBe(true);
      expect(validateFormalPassword("abc")).toBe(false);
    });

    it("completes formal auth for PRODUCER", () => {
      const state = completeFormalAuth("PRODUCER", {
        structureName: "Cacao Industrie CI",
        email: "ops@cacao.ci",
        enterpriseRole: "Direction commerciale",
      });
      expect(state.profile?.kind).toBe("formal");
      expect(state.session?.authMode).toBe("formal_password");
    });

    it("completes formal auth for GROSSISTE_A", () => {
      const state = completeFormalAuth("GROSSISTE_A", {
        structureName: "Réseau Ouest",
        phone: "+22507001111",
      });
      expect(state.session?.actorRole).toBe("GROSSISTE_A");
    });
  });

  describe("session", () => {
    it("creates session with expiry", () => {
      const session = createAuthSession("GROSSISTE_B", "terrain_otp");
      expect(session.sessionId).toBeTruthy();
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it("refresh extends session", () => {
      const session = createAuthSession("GROSSISTE_B", "terrain_otp");
      const refreshed = refreshSessionLocally(session);
      expect(refreshed?.sessionId).toBe(session.sessionId);
    });

    it("detects expired session", () => {
      const session = createAuthSession("GROSSISTE_B", "terrain_otp");
      session.expiresAt = new Date(Date.now() - 1000).toISOString();
      expect(isSessionExpired(session)).toBe(true);
    });

    it("logout clears persisted session", () => {
      completeTerrainAuth("GROSSISTE_B", {
        phone: "+22507000000",
        displayName: "Test",
        city: "Abidjan",
        otpVerified: true,
      });
      logoutAuthState();
      expect(loadPersistedAuthBundle().session).toBeNull();
    });
  });

  describe("session restore", () => {
    it("restores session for matching actor", () => {
      completeTerrainAuth("GROSSISTE_B", {
        phone: "+22507000000",
        displayName: "Test",
        city: "Abidjan",
        otpVerified: true,
      });
      const restored = createInitialAuthState("GROSSISTE_B", {
        venext_auth_foundation_enabled: true,
        venext_session_restore_enabled: true,
      });
      expect(restored.status).toBe("authenticated");
    });

    it("rejects restore on actor mismatch", () => {
      completeTerrainAuth("GROSSISTE_B", {
        phone: "+22507000000",
        displayName: "Test",
        city: "Abidjan",
        otpVerified: true,
      });
      const restored = createInitialAuthState("DETAILLANT", {
        venext_auth_foundation_enabled: true,
      });
      expect(restored.status).toBe("anonymous");
    });
  });

  describe("permissions", () => {
    it("terrain actor gets messaging not formal mail by default", () => {
      const perms = hasPermission(
        { actorRole: "GROSSISTE_B", flags: {} },
        "canAccessTerrainMessaging",
      );
      expect(perms).toBe(true);
    });

    it("producer gets formal mail permission", () => {
      expect(
        hasPermission({ actorRole: "PRODUCER", flags: {} }, "canAccessFormalMail"),
      ).toBe(true);
    });

    it("requireRelationshipPermission blocks when flag off", () => {
      const result = requireRelationshipPermission(
        {
          actorRole: "GROSSISTE_B",
          flags: { relational_catalog_enabled: false },
        },
        "canExposeRelationalCatalog",
      );
      expect(result.allowed).toBe(false);
    });
  });

  describe("guards", () => {
    it("requireAuthenticatedActor passes", () => {
      const state = completeTerrainAuth("GROSSISTE_B", {
        phone: "+22507000000",
        displayName: "Test",
        city: "Abidjan",
        otpVerified: true,
      });
      expect(requireAuthenticatedActor(state, "GROSSISTE_B").allowed).toBe(true);
    });

    it("requireTerrainActor rejects formal profile", () => {
      const state = completeFormalAuth("PRODUCER", { structureName: "X", email: "a@b.c" });
      expect(requireTerrainActor(state, "GROSSISTE_B").allowed).toBe(false);
    });

    it("requireFormalActor passes for producer", () => {
      const state = completeFormalAuth("PRODUCER", {
        structureName: "Cacao CI",
        email: "a@b.c",
      });
      expect(requireFormalActor(state, "PRODUCER").allowed).toBe(true);
    });

    it("actor mismatch guard", () => {
      const session = createAuthSession("GROSSISTE_B", "terrain_otp");
      expect(validateSessionActor(session, "DETAILLANT").valid).toBe(false);
    });
  });

  describe("persistence", () => {
    it("persists and reads locale", () => {
      writePersistedLocale("en");
      expect(readPersistedLocale()).toBe("en");
    });

    it("persists profile bundle", () => {
      const state = completeTerrainAuth("GROSSISTE_B", {
        phone: "+22507000000",
        displayName: "Test",
        city: "Abidjan",
        otpVerified: true,
      });
      persistAuthBundle({ session: state.session, profile: state.profile });
      const bundle = loadPersistedAuthBundle();
      expect(bundle.profile?.kind).toBe("terrain");
    });

    it("rememberNavigationSnapshot stores workspace", () => {
      const prefs = rememberNavigationSnapshot("GROSSISTE_B", "orders", { orderId: "o-1" });
      expect(prefs.lastWorkspace).toBe("orders");
      expect(prefs.lastCommercialContext?.orderId).toBe("o-1");
    });

    it("redirectAuthenticatedActor restores context", () => {
      rememberNavigationSnapshot("GROSSISTE_B", "wallet", { settlementId: "s-1" });
      const target = redirectAuthenticatedActor("GROSSISTE_B");
      expect(target.workspace).toBe("wallet");
      expect(target.commercialContext.settlementId).toBe("s-1");
    });

    it("restoreLastWorkspace defaults by actor", () => {
      expect(restoreLastWorkspace("DETAILLANT", {})).toBe("home");
      expect(restoreLastWorkspace("PRODUCER", {})).toBe("relational-commercial");
    });

    it("restoreLastCommercialContext empty by default", () => {
      expect(restoreLastCommercialContext({})).toEqual({});
    });
  });

  describe("profile", () => {
    it("normalize terrain profile masks phone", () => {
      const p = normalizeTerrainProfile({
        phone: "+22507009999",
        displayName: "A",
        city: "Abidjan",
      });
      expect(p.phoneMasked).toMatch(/9999/);
    });

    it("assertActorMatch", () => {
      expect(assertActorMatch("GROSSISTE_B", "GROSSISTE_B")).toBe(true);
      expect(assertActorMatch("GROSSISTE_B", "DETAILLANT")).toBe(false);
    });
  });

  describe("onboarding restore flag", () => {
    it("marks onboarding in preferences", () => {
      const state = completeTerrainAuth("GROSSISTE_B", {
        phone: "+22507000000",
        displayName: "Test",
        city: "Abidjan",
        otpVerified: true,
      });
      expect(state.preferences.onboardingDone).toBe(true);
    });
  });

  describe("anti enterprise", () => {
    it("no multi actor switch in session", () => {
      const s1 = createAuthSession("GROSSISTE_B", "terrain_otp");
      const s2 = createAuthSession("DETAILLANT", "terrain_otp");
      expect(s1.actorRole).not.toBe(s2.actorRole);
    });
  });
});
