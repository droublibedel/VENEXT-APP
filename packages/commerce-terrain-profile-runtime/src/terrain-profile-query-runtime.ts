import type { TerrainProfileId } from "./types.js";
import { buildTerrainQueryKey } from "./profile-cache-namespaces.js";

export type TerrainQueryEntry = {
  key: string[];
  profile: TerrainProfileId;
  profileContextId: string;
  userId: string;
  abortController: AbortController;
  createdAt: number;
};

const activeQueries = new Map<string, TerrainQueryEntry>();

function queryMapKey(key: string[]): string {
  return key.join("\0");
}

export function registerTerrainQuery(
  userId: string,
  activeProfile: TerrainProfileId,
  profileContextId: string,
  domain: string,
  ...parts: string[]
): { key: string[]; signal: AbortSignal } {
  const key = buildTerrainQueryKey(userId, activeProfile, profileContextId, domain, ...parts);
  const id = queryMapKey(key);
  const existing = activeQueries.get(id);
  existing?.abortController.abort("terrain_query_replaced");

  const abortController = new AbortController();
  activeQueries.set(id, {
    key,
    profile: activeProfile,
    profileContextId,
    userId,
    abortController,
    createdAt: Date.now(),
  });
  return { key, signal: abortController.signal };
}

export function cancelTerrainQueriesForProfile(profile: TerrainProfileId): number {
  let cancelled = 0;
  for (const [id, entry] of activeQueries) {
    if (entry.profile === profile) {
      entry.abortController.abort("terrain_profile_switch_cancel");
      activeQueries.delete(id);
      cancelled += 1;
    }
  }
  return cancelled;
}

export function removeTerrainQueriesForProfile(profile: TerrainProfileId): number {
  let removed = 0;
  for (const [id, entry] of activeQueries) {
    if (entry.profile === profile) {
      activeQueries.delete(id);
      removed += 1;
    }
  }
  return removed;
}

export function listActiveTerrainQueries(profile?: TerrainProfileId): TerrainQueryEntry[] {
  const all = [...activeQueries.values()];
  return profile ? all.filter((q) => q.profile === profile) : all;
}

export function resetTerrainQueryRuntime(): void {
  for (const entry of activeQueries.values()) {
    entry.abortController.abort("terrain_query_runtime_reset");
  }
  activeQueries.clear();
}
