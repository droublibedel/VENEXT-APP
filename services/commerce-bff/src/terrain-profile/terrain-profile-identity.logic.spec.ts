import { describe, expect, it } from "vitest";

import {
  buildAuditPayload,
  mapIdentityToClientPayload,
  normalizeTerrainProfileApiId,
  resolveIdentityConflict,
  resolveProfilePermissions,
  validateProfileSwitch,
  validateSetCurrentProfile,
  validateUserKey,
  type TerrainProfileIdentityRecord,
} from "./terrain-profile-identity.logic.js";

const baseRecord = (overrides: Partial<TerrainProfileIdentityRecord> = {}): TerrainProfileIdentityRecord => ({
  userKey: "22507000001",
  enabledProfiles: ["GROSSISTE_B", "DETAILLANT"],
  primaryProfile: "GROSSISTE_B",
  currentActiveProfile: "GROSSISTE_B",
  activeProfileVersion: 2,
  switchCount: 1,
  ...overrides,
});

describe("terrain-profile-identity.logic", () => {
  describe.each([
    ["GROSSISTE_B", "GROSSISTE_B"],
    ["grossiste_b", "GROSSISTE_B"],
    ["GROSSISTE-B", "GROSSISTE_B"],
    ["DETAILLANT", "DETAILLANT"],
    ["detaillant", "DETAILLANT"],
    ["", null],
    ["producer", null],
    ["  DETAILLANT  ", "DETAILLANT"],
  ])("normalizeTerrainProfileApiId(%s)", (input, expected) => {
    it(`returns ${expected}`, () => {
      expect(normalizeTerrainProfileApiId(input)).toBe(expected);
    });
  });

  describe.each([
    ["22507000001", true],
    ["anonymous", false],
    ["", false],
    ["   ", false],
  ])("validateUserKey(%s)", (input, expected) => {
    it(`is ${expected}`, () => {
      expect(validateUserKey(input)).toBe(expected);
    });
  });

  it("creates first profile on onboarding validation", () => {
    const result = validateSetCurrentProfile("22507000001", "DETAILLANT", null);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.currentActiveProfile).toBe("DETAILLANT");
      expect(result.record.primaryProfile).toBe("DETAILLANT");
      expect(result.record.activeProfileVersion).toBe(1);
    }
  });

  it("rejects invalid user on set current profile", () => {
    const result = validateSetCurrentProfile("anonymous", "DETAILLANT", null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_user");
  });

  it("rejects invalid profile on set current profile", () => {
    const result = validateSetCurrentProfile("22507000001", "producer", null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_profile");
  });

  it("enables profile on subsequent set current profile", () => {
    const existing = baseRecord();
    const result = validateSetCurrentProfile("22507000001", "DETAILLANT", existing);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.enabledProfiles).toContain("DETAILLANT");
      expect(result.record.activeProfileVersion).toBe(3);
    }
  });

  it("rejects switch when identity missing", () => {
    const result = validateProfileSwitch("22507000001", "DETAILLANT", null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("identity_not_found");
  });

  it("auto-enables profile on first switch to second métier", () => {
    const existing = baseRecord({ enabledProfiles: ["GROSSISTE_B"], currentActiveProfile: "GROSSISTE_B" });
    const result = validateProfileSwitch("22507000001", "DETAILLANT", existing);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.enabledProfiles).toContain("DETAILLANT");
      expect(result.record.currentActiveProfile).toBe("DETAILLANT");
    }
  });

  it("rejects switch to disabled profile when profile id invalid", () => {
    const existing = baseRecord({ enabledProfiles: ["GROSSISTE_B"] });
    const result = validateProfileSwitch("22507000001", "INVALID", existing);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_profile");
  });

  it("allows noop switch to same profile", () => {
    const existing = baseRecord();
    const result = validateProfileSwitch("22507000001", "GROSSISTE_B", existing);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.currentActiveProfile).toBe("GROSSISTE_B");
  });

  it("switches profile and increments version", () => {
    const existing = baseRecord();
    const result = validateProfileSwitch("22507000001", "DETAILLANT", existing, {
      deviceId: "device-a",
      switchReason: "user_settings",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.currentActiveProfile).toBe("DETAILLANT");
      expect(result.record.lastActiveProfile).toBe("GROSSISTE_B");
      expect(result.record.activeProfileVersion).toBe(3);
      expect(result.record.deviceId).toBe("device-a");
    }
  });

  describe.each([
    ["GROSSISTE_B", "network_sales_downstream"],
    ["DETAILLANT", "supplier_purchases_upstream"],
  ])("resolveProfilePermissions(%s)", (profile, ordersMode) => {
    it(`ordersMode=${ordersMode}`, () => {
      const perms = resolveProfilePermissions(profile as "GROSSISTE_B" | "DETAILLANT");
      expect(perms.ordersMode).toBe(ordersMode);
      expect(perms.canAccessCatalog).toBe(true);
      expect(perms.canAccessOrders).toBe(true);
    });
  });

  it("grossiste permissions include audio flags", () => {
    const perms = resolveProfilePermissions("GROSSISTE_B");
    expect(perms.featureFlags["grossisteB.messaging.audio.enabled"]).toBe(true);
  });

  it("detaillant permissions include discovery flags", () => {
    const perms = resolveProfilePermissions("DETAILLANT");
    expect(perms.featureFlags["detaillant.catalog.discovery.enabled"]).toBe(true);
  });

  it("resolveIdentityConflict realigns stale client", () => {
    const server = baseRecord({ activeProfileVersion: 5 });
    const result = resolveIdentityConflict(server, 3);
    expect(result.action).toBe("realign");
  });

  it("resolveIdentityConflict noop when client up to date", () => {
    const server = baseRecord({ activeProfileVersion: 5 });
    const result = resolveIdentityConflict(server, 5);
    expect(result.action).toBe("noop");
  });

  it("maps identity to client payload with cachedProfile false", () => {
    const payload = mapIdentityToClientPayload(baseRecord());
    expect(payload.currentActiveProfile).toBe("grossiste_b");
    expect(payload.cachedProfile).toBe(false);
    expect(payload.activeProfileVersion).toBe(2);
  });

  describe.each([
    "profile_selected_onboarding",
    "profile_switch_requested",
    "profile_switch_confirmed",
    "profile_switch_rejected",
    "profile_loaded_from_backend",
    "profile_cache_used_offline",
    "profile_conflict_resolved",
  ] as const)("buildAuditPayload(%s)", (event) => {
    it("includes event and timestamp", () => {
      const payload = buildAuditPayload(event, { userKey: "22507000001" });
      expect(payload.event).toBe(event);
      expect(payload.userKey).toBe("22507000001");
      expect(payload.at).toBeTruthy();
    });
  });

  describe.each([
    ["22507000001", "GROSSISTE_B"],
    ["22507000002", "DETAILLANT"],
    ["22507000003", "GROSSISTE_B"],
    ["22507000004", "DETAILLANT"],
    ["22507000005", "GROSSISTE_B"],
    ["22507000006", "DETAILLANT"],
    ["22507000007", "GROSSISTE_B"],
    ["22507000008", "DETAILLANT"],
    ["22507000009", "GROSSISTE_B"],
    ["22507000010", "DETAILLANT"],
  ])("multi-user onboarding persistence %s -> %s", (userKey, profile) => {
    it("persists validated profile", () => {
      const result = validateSetCurrentProfile(userKey, profile, null);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.record.userKey).toBe(userKey);
    });
  });

  describe.each([
    ["GROSSISTE_B", "DETAILLANT"],
    ["DETAILLANT", "GROSSISTE_B"],
    ["GROSSISTE_B", "GROSSISTE_B"],
    ["DETAILLANT", "DETAILLANT"],
    ["GROSSISTE_B", "DETAILLANT"],
    ["DETAILLANT", "GROSSISTE_B"],
    ["GROSSISTE_B", "DETAILLANT"],
    ["DETAILLANT", "GROSSISTE_B"],
    ["GROSSISTE_B", "DETAILLANT"],
    ["DETAILLANT", "GROSSISTE_B"],
  ])("switch matrix from %s to %s", (from, to) => {
    it("validates enabled switch", () => {
      const existing = baseRecord({
        currentActiveProfile: from as "GROSSISTE_B" | "DETAILLANT",
        enabledProfiles: ["GROSSISTE_B", "DETAILLANT"],
      });
      const result = validateProfileSwitch("22507000001", to, existing);
      expect(result.ok).toBe(true);
    });
  });
});
