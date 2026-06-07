import {
  buildAuditPayload,
  mapIdentityToClientPayload,
  resolveProfilePermissions,
  type TerrainProfileAuditEvent,
  type TerrainProfileIdentityRecord,
  validateProfileSwitch,
  validateSetCurrentProfile,
  validateUserKey,
} from "./terrain-profile-identity.logic.js";
import { fetchCore } from "../core-client.js";

const memory = new Map<string, TerrainProfileIdentityRecord>();
const auditLog: Record<string, unknown>[] = [];

export function getTerrainProfileAuditLog(): readonly Record<string, unknown>[] {
  return auditLog;
}

export function clearTerrainProfileAuditLog(): void {
  auditLog.length = 0;
}

export function clearTerrainProfileMemory(): void {
  memory.clear();
}

function audit(event: TerrainProfileAuditEvent, detail: Record<string, unknown> = {}): void {
  auditLog.push(buildAuditPayload(event, detail));
}

async function persist(record: TerrainProfileIdentityRecord): Promise<TerrainProfileIdentityRecord> {
  memory.set(record.userKey, record);
  await fetchCore("/commerce-foundation/terrain/profile-identity", {
    method: "PUT",
    body: JSON.stringify(record),
  });
  return record;
}

export async function getTerrainProfileIdentity(
  userKey: string,
): Promise<TerrainProfileIdentityRecord | null> {
  if (!validateUserKey(userKey)) return null;

  const cached = memory.get(userKey);
  if (cached) return cached;

  const upstream = await fetchCore<{ payload: TerrainProfileIdentityRecord | null }>(
    `/commerce-foundation/terrain/profile-identity/${encodeURIComponent(userKey)}`,
  );
  if (upstream.ok && upstream.data?.payload) {
    const record = {
      ...upstream.data.payload,
      permissions: resolveProfilePermissions(upstream.data.payload.currentActiveProfile),
      activeProfileVersion: upstream.data.payload.activeProfileVersion ?? 1,
    };
    memory.set(userKey, record);
    audit("profile_loaded_from_backend", { userKey, version: record.activeProfileVersion });
    return record;
  }
  return null;
}

export async function setCurrentTerrainProfile(payload: {
  userKey: string;
  currentActiveProfile: string;
  primaryProfile?: string | null;
  deviceId?: string;
  source?: string;
}): Promise<{ ok: true; identity: TerrainProfileIdentityRecord } | { ok: false; code: string; message: string }> {
  audit("profile_selected_onboarding", { userKey: payload.userKey, profile: payload.currentActiveProfile });
  const existing = await getTerrainProfileIdentity(payload.userKey);
  const validation = validateSetCurrentProfile(payload.userKey, payload.currentActiveProfile, existing);
  if (!validation.ok) {
    audit("profile_switch_rejected", { userKey: payload.userKey, code: validation.code });
    return validation;
  }

  const record: TerrainProfileIdentityRecord = {
    ...validation.record,
    deviceId: payload.deviceId ?? validation.record.deviceId,
    source: payload.source ?? validation.record.source,
    permissions: resolveProfilePermissions(validation.record.currentActiveProfile),
  };

  const saved = await persist(record);
  audit("profile_switch_confirmed", { userKey: saved.userKey, profile: saved.currentActiveProfile });
  return { ok: true, identity: saved };
}

export async function switchTerrainProfileIdentity(payload: {
  userKey: string;
  targetProfile: string;
  deviceId?: string;
  switchReason?: string;
  clientVersion?: number;
}): Promise<
  | { ok: true; identity: TerrainProfileIdentityRecord; conflictResolved: boolean }
  | { ok: false; code: string; message: string }
> {
  audit("profile_switch_requested", {
    userKey: payload.userKey,
    targetProfile: payload.targetProfile,
    clientVersion: payload.clientVersion,
  });

  let existing = await getTerrainProfileIdentity(payload.userKey);
  if (!existing) {
    const bootstrap = await setCurrentTerrainProfile({
      userKey: payload.userKey,
      currentActiveProfile: payload.targetProfile,
      primaryProfile: payload.targetProfile,
      deviceId: payload.deviceId,
      source: "switch_bootstrap",
    });
    if (!bootstrap.ok) {
      audit("profile_switch_rejected", { userKey: payload.userKey, code: bootstrap.code });
      return bootstrap;
    }
    existing = bootstrap.identity;
  }

  if (payload.clientVersion != null && payload.clientVersion < existing.activeProfileVersion) {
    audit("profile_conflict_resolved", {
      userKey: payload.userKey,
      serverVersion: existing.activeProfileVersion,
      clientVersion: payload.clientVersion,
    });
    return {
      ok: true,
      identity: {
        ...existing,
        permissions: resolveProfilePermissions(existing.currentActiveProfile),
      },
      conflictResolved: true,
    };
  }

  const validation = validateProfileSwitch(payload.userKey, payload.targetProfile, existing, {
    deviceId: payload.deviceId,
    switchReason: payload.switchReason,
  });

  if (!validation.ok) {
    audit("profile_switch_rejected", { userKey: payload.userKey, code: validation.code });
    return validation;
  }

  const saved = await persist(validation.record);
  audit("profile_switch_confirmed", {
    userKey: saved.userKey,
    profile: saved.currentActiveProfile,
    version: saved.activeProfileVersion,
  });
  return { ok: true, identity: saved, conflictResolved: false };
}

export function toClientIdentityResponse(record: TerrainProfileIdentityRecord) {
  return mapIdentityToClientPayload(record);
}

export async function upsertTerrainProfileIdentity(
  record: TerrainProfileIdentityRecord,
): Promise<TerrainProfileIdentityRecord> {
  return persist({
    ...record,
    permissions: resolveProfilePermissions(record.currentActiveProfile),
    activeProfileVersion: record.activeProfileVersion ?? 1,
  });
}

export function markOfflineCacheUsed(userKey: string): void {
  audit("profile_cache_used_offline", { userKey });
}
