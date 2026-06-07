import type { TerrainProfileId } from "./types.js";

export type TerrainNotificationScope = "GLOBAL_USER" | "GROSSISTE_CONTEXT" | "DETAILLANT_CONTEXT";

export function resolveNotificationScope(profile: TerrainProfileId | null): TerrainNotificationScope {
  if (!profile) return "GLOBAL_USER";
  return profile === "grossiste_b" ? "GROSSISTE_CONTEXT" : "DETAILLANT_CONTEXT";
}

export function notificationMatchesActiveProfile(
  scope: TerrainNotificationScope,
  activeProfile: TerrainProfileId | null,
): boolean {
  if (scope === "GLOBAL_USER") return true;
  if (!activeProfile) return false;
  if (scope === "GROSSISTE_CONTEXT") return activeProfile === "grossiste_b";
  if (scope === "DETAILLANT_CONTEXT") return activeProfile === "detaillant";
  return false;
}

export type TerrainNotificationRecord = {
  id: string;
  scope: TerrainNotificationScope;
  title: string;
  profileContextId: string;
};

const notificationCache = new Map<string, TerrainNotificationRecord[]>();

function cacheKey(profileContextId: string, profile: TerrainProfileId): string {
  return `${profileContextId}:${profile}`;
}

export function setTerrainNotificationsForProfile(
  profileContextId: string,
  profile: TerrainProfileId,
  items: TerrainNotificationRecord[],
): void {
  notificationCache.set(cacheKey(profileContextId, profile), items);
}

export function listTerrainNotificationsForActiveProfile(
  profileContextId: string,
  activeProfile: TerrainProfileId,
  globalItems: TerrainNotificationRecord[] = [],
): TerrainNotificationRecord[] {
  const scoped = notificationCache.get(cacheKey(profileContextId, activeProfile)) ?? [];
  const globals = globalItems.filter((n) => n.scope === "GLOBAL_USER");
  const contextual = scoped.filter((n) => notificationMatchesActiveProfile(n.scope, activeProfile));
  return [...globals, ...contextual];
}

export function purgeTerrainNotificationsForProfile(
  profileContextId: string,
  profile: TerrainProfileId,
): void {
  notificationCache.delete(cacheKey(profileContextId, profile));
}

export function resetTerrainNotificationCache(): void {
  notificationCache.clear();
}
