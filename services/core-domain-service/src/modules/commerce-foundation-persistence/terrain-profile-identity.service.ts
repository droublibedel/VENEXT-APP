import { Injectable } from "@nestjs/common";

import { CommerceFoundationService } from "./commerce-foundation.service";

export type TerrainProfileIdentityPayload = {
  userKey: string;
  enabledProfiles: string[];
  primaryProfile: string | null;
  currentActiveProfile: string;
  lastActiveProfile?: string | null;
  activatedAt?: string;
  switchedAt?: string;
  switchReason?: string;
  source?: string;
  switchCount?: number;
  profileSessionId?: string;
  activeProfileVersion?: number;
  lastSyncedAt?: string;
  deviceId?: string;
  lastDeviceId?: string;
  permissions?: Record<string, unknown>;
};

@Injectable()
export class TerrainProfileIdentityService {
  constructor(private readonly foundation: CommerceFoundationService) {}

  private entityKey(userKey: string) {
    return `terrain-profile-${userKey}`;
  }

  async get(userKey: string): Promise<TerrainProfileIdentityPayload | null> {
    return this.foundation.getByKey<TerrainProfileIdentityPayload>(
      "TerrainBusinessIdentity",
      this.entityKey(userKey),
    );
  }

  async upsert(payload: TerrainProfileIdentityPayload): Promise<TerrainProfileIdentityPayload> {
    const now = new Date().toISOString();
    const existing = await this.get(payload.userKey);
    const record: TerrainProfileIdentityPayload = {
      ...payload,
      enabledProfiles: [...new Set(payload.enabledProfiles)],
      activatedAt: existing?.activatedAt ?? payload.activatedAt ?? now,
      switchedAt: payload.switchedAt ?? now,
      lastSyncedAt: now,
      activeProfileVersion: payload.activeProfileVersion ?? (existing?.activeProfileVersion ?? 0) + 1,
      switchCount: payload.switchCount ?? existing?.switchCount ?? 0,
    };
    await this.foundation.upsert("TerrainBusinessIdentity", this.entityKey(payload.userKey), record, {
      actorRole: record.currentActiveProfile,
    });
    return record;
  }
}
