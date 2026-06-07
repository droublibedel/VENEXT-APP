export type TerrainProfileApiId = "GROSSISTE_B" | "DETAILLANT";

export type TerrainProfilePermissions = {
  profile: TerrainProfileApiId;
  canAccessCatalog: boolean;
  canAccessOrders: boolean;
  canAccessNetwork: boolean;
  canAccessMessaging: boolean;
  ordersMode: "network_sales_downstream" | "supplier_purchases_upstream";
  featureFlags: Record<string, boolean>;
};

export type TerrainProfileIdentityRecord = {
  userKey: string;
  enabledProfiles: TerrainProfileApiId[];
  primaryProfile: TerrainProfileApiId | null;
  currentActiveProfile: TerrainProfileApiId;
  lastActiveProfile?: TerrainProfileApiId | null;
  activatedAt?: string;
  switchedAt?: string;
  switchReason?: string;
  source?: string;
  switchCount?: number;
  profileSessionId?: string;
  activeProfileVersion: number;
  lastSyncedAt?: string;
  deviceId?: string;
  lastDeviceId?: string;
  permissions?: TerrainProfilePermissions;
};

export type TerrainProfileSwitchValidation =
  | { ok: true; record: TerrainProfileIdentityRecord }
  | { ok: false; code: string; message: string };

export function normalizeTerrainProfileApiId(value: string): TerrainProfileApiId | null {
  const normalized = value.trim().toUpperCase().replace("-", "_");
  if (normalized === "GROSSISTE_B") return "GROSSISTE_B";
  if (normalized === "DETAILLANT") return "DETAILLANT";
  return null;
}

export type TerrainProfileClientId = "grossiste_b" | "detaillant";

export function toClientProfileId(profile: TerrainProfileApiId): TerrainProfileClientId {
  return profile === "GROSSISTE_B" ? "grossiste_b" : "detaillant";
}

export function toApiProfileIdFromClient(profile: TerrainProfileClientId): TerrainProfileApiId {
  return profile === "grossiste_b" ? "GROSSISTE_B" : "DETAILLANT";
}

export function resolveProfilePermissions(profile: TerrainProfileApiId): TerrainProfilePermissions {
  if (profile === "GROSSISTE_B") {
    return {
      profile,
      canAccessCatalog: true,
      canAccessOrders: true,
      canAccessNetwork: true,
      canAccessMessaging: true,
      ordersMode: "network_sales_downstream",
      featureFlags: {
        "grossisteB.catalogue.audio.enabled": true,
        "grossisteB.messaging.audio.enabled": true,
      },
    };
  }
  return {
    profile,
    canAccessCatalog: true,
    canAccessOrders: true,
    canAccessNetwork: true,
    canAccessMessaging: true,
    ordersMode: "supplier_purchases_upstream",
    featureFlags: {
      "detaillant.smart-network.enabled": true,
      "detaillant.catalog.discovery.enabled": true,
    },
  };
}

export function validateUserKey(userKey: string): boolean {
  return Boolean(userKey && userKey.trim() && userKey !== "anonymous");
}

export function validateSetCurrentProfile(
  userKey: string,
  profile: string,
  existing: TerrainProfileIdentityRecord | null,
): TerrainProfileSwitchValidation {
  if (!validateUserKey(userKey)) {
    return { ok: false, code: "invalid_user", message: "Utilisateur invalide." };
  }
  const normalized = normalizeTerrainProfileApiId(profile);
  if (!normalized) {
    return { ok: false, code: "invalid_profile", message: "Profil inconnu." };
  }

  const now = new Date().toISOString();
  const enabled = existing
    ? [...new Set([...existing.enabledProfiles, normalized])]
    : [normalized];

  const record: TerrainProfileIdentityRecord = {
    userKey,
    enabledProfiles: enabled,
    primaryProfile: normalized,
    currentActiveProfile: normalized,
    lastActiveProfile: existing?.currentActiveProfile ?? null,
    activatedAt: existing?.activatedAt ?? now,
    switchedAt: now,
    source: existing ? "runtime" : "onboarding",
    switchCount: (existing?.switchCount ?? 0) + (existing?.currentActiveProfile === normalized ? 0 : 1),
    activeProfileVersion: (existing?.activeProfileVersion ?? 0) + 1,
    lastSyncedAt: now,
    permissions: resolveProfilePermissions(normalized),
  };

  return { ok: true, record };
}

export function validateProfileSwitch(
  userKey: string,
  targetProfile: string,
  existing: TerrainProfileIdentityRecord | null,
  options: { deviceId?: string; switchReason?: string; clientVersion?: number } = {},
): TerrainProfileSwitchValidation {
  if (!validateUserKey(userKey)) {
    return { ok: false, code: "invalid_user", message: "Utilisateur invalide." };
  }
  if (!existing) {
    return { ok: false, code: "identity_not_found", message: "Identité terrain introuvable." };
  }

  const normalized = normalizeTerrainProfileApiId(targetProfile);
  if (!normalized) {
    return { ok: false, code: "invalid_profile", message: "Profil inconnu." };
  }

  if (!existing.enabledProfiles.includes(normalized)) {
    // First switch to a second métier activates that profile for the user.
    const enabledProfiles = [...new Set([...existing.enabledProfiles, normalized])];
    const now = new Date().toISOString();
    const record: TerrainProfileIdentityRecord = {
      ...existing,
      enabledProfiles,
      lastActiveProfile: existing.currentActiveProfile,
      currentActiveProfile: normalized,
      switchedAt: now,
      switchReason: options.switchReason,
      switchCount: (existing.switchCount ?? 0) + 1,
      activeProfileVersion: (existing.activeProfileVersion ?? 0) + 1,
      lastSyncedAt: now,
      lastDeviceId: existing.deviceId,
      deviceId: options.deviceId ?? existing.deviceId,
      permissions: resolveProfilePermissions(normalized),
      source: "switch",
    };
    return { ok: true, record };
  }

  if (existing.currentActiveProfile === normalized) {
    return {
      ok: true,
      record: {
        ...existing,
        permissions: resolveProfilePermissions(normalized),
        lastSyncedAt: new Date().toISOString(),
      },
    };
  }

  const now = new Date().toISOString();
  const record: TerrainProfileIdentityRecord = {
    ...existing,
    lastActiveProfile: existing.currentActiveProfile,
    currentActiveProfile: normalized,
    switchedAt: now,
    switchReason: options.switchReason,
    switchCount: (existing.switchCount ?? 0) + 1,
    activeProfileVersion: (existing.activeProfileVersion ?? 0) + 1,
    lastSyncedAt: now,
    lastDeviceId: existing.deviceId,
    deviceId: options.deviceId ?? existing.deviceId,
    permissions: resolveProfilePermissions(normalized),
    source: "switch",
  };

  return { ok: true, record };
}

export function resolveIdentityConflict(
  server: TerrainProfileIdentityRecord,
  clientVersion?: number,
): { action: "realign" | "noop"; record: TerrainProfileIdentityRecord } {
  if (clientVersion != null && clientVersion >= server.activeProfileVersion) {
    return { action: "noop", record: server };
  }
  return { action: "realign", record: server };
}

export function mapIdentityToClientPayload(record: TerrainProfileIdentityRecord) {
  return {
    userKey: record.userKey,
    enabledProfiles: record.enabledProfiles.map(toClientProfileId),
    primaryProfile: record.primaryProfile ? toClientProfileId(record.primaryProfile) : null,
    currentActiveProfile: toClientProfileId(record.currentActiveProfile),
    lastActiveProfile: record.lastActiveProfile ? toClientProfileId(record.lastActiveProfile) : null,
    activatedAt: record.activatedAt,
    switchedAt: record.switchedAt,
    switchReason: record.switchReason,
    source: record.source,
    switchCount: record.switchCount ?? 0,
    profileSessionId: record.profileSessionId,
    activeProfileVersion: record.activeProfileVersion,
    lastSyncedAt: record.lastSyncedAt,
    deviceId: record.deviceId,
    permissions: record.permissions,
    cachedProfile: false as const,
  };
}

export type TerrainProfileAuditEvent =
  | "profile_selected_onboarding"
  | "profile_switch_requested"
  | "profile_switch_confirmed"
  | "profile_switch_rejected"
  | "profile_loaded_from_backend"
  | "profile_cache_used_offline"
  | "profile_conflict_resolved";

export function buildAuditPayload(
  event: TerrainProfileAuditEvent,
  detail: Record<string, unknown> = {},
): Record<string, unknown> {
  return { event, at: new Date().toISOString(), ...detail };
}
