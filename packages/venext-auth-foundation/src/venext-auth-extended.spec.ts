import { describe, expect, it, beforeEach } from "vitest";

import {
  createAuthSession,
  createEmptyFormalProfile,
  createEmptyTerrainProfile,
  createInitialAuthState,
  createSessionId,
  defaultWorkspaceForActor,
  detectDeviceFingerprint,
  emptyProfileForRole,
  guardUxMessage,
  isActiveSession,
  isAuthFoundationEnabled,
  isFormalActor,
  isFormalProfileComplete,
  isProfileCompleteForRole,
  isTerrainActor,
  isTerrainProfileComplete,
  normalizeFormalProfile,
  permissionLabel,
  profileDisplayLabel,
  refreshAuthState,
  resolveCommercePermissions,
  sanitizeAuthErrorMessage,
  toGovernanceActorSlug,
  touchSession,
  validateFlagsCoherence,
  validateLocaleCoherence,
  validateProfileCoherence,
  visiblePermissions,
  VENEXT_LOCALE_STORAGE_KEY,
  VENEXT_PROFILE_STORAGE_KEY,
  VENEXT_SESSION_STORAGE_KEY,
} from "./index";

describe("venext-auth extended (20.78)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exposes storage key constants", () => {
    expect(VENEXT_SESSION_STORAGE_KEY).toBe("venext_session_v1");
    expect(VENEXT_PROFILE_STORAGE_KEY).toBe("venext_actor_profile_v1");
    expect(VENEXT_LOCALE_STORAGE_KEY).toBe("venext_locale_v1");
  });

  it("classifies terrain and formal actors", () => {
    expect(isTerrainActor("GROSSISTE_B")).toBe(true);
    expect(isTerrainActor("PRODUCER")).toBe(false);
    expect(isFormalActor("GROSSISTE_A")).toBe(true);
    expect(isFormalActor("DETAILLANT")).toBe(false);
  });

  it("maps governance slugs", () => {
    expect(toGovernanceActorSlug("PRODUCER")).toBe("producteur");
    expect(toGovernanceActorSlug("DETAILLANT")).toBe("detaillant");
  });

  it("default workspace per actor", () => {
    expect(defaultWorkspaceForActor("GROSSISTE_B")).toBe("activity");
    expect(defaultWorkspaceForActor("PRODUCER")).toBe("relational-commercial");
  });

  it("creates unique session ids", () => {
    expect(createSessionId()).not.toBe(createSessionId());
  });

  it("touches session lastActiveAt", () => {
    const session = createAuthSession("DETAILLANT", "terrain_otp");
    const touched = touchSession(session);
    expect(touched.lastActiveAt).toBeTruthy();
  });

  it("isActiveSession false when expired", () => {
    const session = createAuthSession("DETAILLANT", "terrain_otp");
    session.expiresAt = new Date(0).toISOString();
    expect(isActiveSession(session)).toBe(false);
  });

  it("isAuthFoundationEnabled respects flag", () => {
    expect(isAuthFoundationEnabled({ venext_auth_foundation_enabled: false })).toBe(false);
    expect(isAuthFoundationEnabled({})).toBe(true);
  });

  it("createInitialAuthState anonymous when foundation off", () => {
    const state = createInitialAuthState("GROSSISTE_B", {
      venext_auth_foundation_enabled: false,
    });
    expect(state.status).toBe("anonymous");
  });

  it("resolveCommercePermissions all keys", () => {
    const perms = resolveCommercePermissions({ actorRole: "GROSSISTE_A", flags: {} });
    expect(Object.keys(perms)).toHaveLength(6);
    expect(perms.canAccessFormalMail).toBe(true);
  });

  it("visiblePermissions filters allowed", () => {
    const keys = visiblePermissions({ actorRole: "DETAILLANT", flags: {} });
    expect(keys.length).toBeGreaterThan(0);
  });

  it("permissionLabel returns commerce-first wording", () => {
    expect(permissionLabel("canAccessTerrainMessaging")).toContain("Messagerie");
  });

  it("guardUxMessage returns null when allowed", () => {
    expect(guardUxMessage({ allowed: true })).toBeNull();
  });

  it("sanitizeAuthErrorMessage actor mismatch", () => {
    expect(sanitizeAuthErrorMessage("actor-mismatch")).toContain("application");
  });

  it("validateProfileCoherence terrain match", () => {
    const session = createAuthSession("GROSSISTE_B", "terrain_otp");
    const profile = normalizeFormalProfile({ structureName: "X" });
    expect(validateProfileCoherence(session, profile).valid).toBe(false);
  });

  it("validateLocaleCoherence allows missing", () => {
    expect(validateLocaleCoherence(undefined, "fr-CI")).toBe(true);
  });

  it("validateFlagsCoherence detects mismatch", () => {
    expect(
      validateFlagsCoherence(
        { venext_auth_foundation_enabled: true },
        { venext_auth_foundation_enabled: false },
      ),
    ).toBe(false);
  });

  it("empty profiles for roles", () => {
    expect(emptyProfileForRole("GROSSISTE_B").kind).toBe("terrain");
    expect(emptyProfileForRole("PRODUCER").kind).toBe("formal");
  });

  it("isProfileCompleteForRole false when empty", () => {
    expect(isProfileCompleteForRole("GROSSISTE_B", createEmptyTerrainProfile())).toBe(false);
    expect(isProfileCompleteForRole("PRODUCER", createEmptyFormalProfile())).toBe(false);
  });

  it("formal profile complete with structure", () => {
    const p = normalizeFormalProfile({
      structureName: "Structure CI",
      email: "a@b.ci",
    });
    expect(isFormalProfileComplete(p)).toBe(true);
  });

  it("profileDisplayLabel terrain uses displayName", () => {
    const p = normalizeFormalProfile({ structureName: "Entrepôt Ouest" });
    expect(profileDisplayLabel(p)).toBe("Entrepôt Ouest");
  });

  it("refreshAuthState extends valid session", () => {
    const session = createAuthSession("GROSSISTE_B", "terrain_otp");
    const next = refreshAuthState({
      status: "authenticated",
      session,
      profile: null,
      preferences: {},
    });
    expect(next.session?.sessionId).toBe(session.sessionId);
  });

  it("detectDeviceFingerprint returns platform label", () => {
    const fp = detectDeviceFingerprint();
    expect(["web", "mobile", "unknown"]).toContain(fp.platform);
    expect(fp.label.length).toBeGreaterThan(0);
  });
});
