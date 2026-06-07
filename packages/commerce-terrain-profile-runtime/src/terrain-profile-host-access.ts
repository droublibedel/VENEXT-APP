import type { TerrainProfileId } from "./types.js";

export type TerrainProfileHostRenderState = "loading" | "ready" | "unavailable";

export type TerrainProfileHostAccessInput = {
  expectedProfile: TerrainProfileId;
  activeProfile: TerrainProfileId | null;
  mobileEnabled: boolean | undefined;
  hydrated: boolean;
};

/** Profil terrain actif côté runtime — le host correspondant doit toujours se monter. */
export function isTerrainProfileHostActive(
  activeProfile: TerrainProfileId | null | undefined,
  expectedProfile: TerrainProfileId,
): boolean {
  return activeProfile === expectedProfile;
}

/**
 * Résout si un host mobile (détaillant / grossiste B) doit s'afficher.
 * Un profil activé dans le shell terrain ne doit jamais retomber sur un placeholder.
 */
export function resolveTerrainProfileHostState(
  input: TerrainProfileHostAccessInput,
): TerrainProfileHostRenderState {
  if (isTerrainProfileHostActive(input.activeProfile, input.expectedProfile)) {
    return "ready";
  }
  if (!input.hydrated) return "loading";
  if (input.mobileEnabled === false) return "unavailable";
  return "ready";
}
