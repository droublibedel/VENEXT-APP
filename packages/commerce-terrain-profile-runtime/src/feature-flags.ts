import type { TerrainProfileId } from "./types.js";

export type TerrainProfileFeatureFlags = Record<string, boolean | undefined>;

const GROSSISTE_B_FLAGS: TerrainProfileFeatureFlags = {
  grossiste_b_mobile_enabled: true,
  grossisteB_profile_enabled: true,
  terrain_profile_switch_enabled: true,
  mobile_terrain_shell_enabled: true,
  "grossisteB.catalogue.audio.enabled": true,
  "grossisteB.messaging.audio.enabled": true,
};

const DETAILLANT_FLAGS: TerrainProfileFeatureFlags = {
  detaillant_mobile_enabled: true,
  detaillant_profile_enabled: true,
  terrain_profile_switch_enabled: true,
  mobile_terrain_shell_enabled: true,
  "detaillant.smart-network.enabled": true,
  "detaillant.catalog.discovery.enabled": true,
};

export function resolveActiveProfileFeatureFlags(
  profile: TerrainProfileId | null,
): TerrainProfileFeatureFlags {
  if (!profile) return {};
  return profile === "grossiste_b" ? { ...GROSSISTE_B_FLAGS } : { ...DETAILLANT_FLAGS };
}

export function mergeTerrainProfileFeatureFlags<T extends TerrainProfileFeatureFlags>(
  base: T,
  profile: TerrainProfileId | null,
): T {
  if (!profile) return base;
  const active = resolveActiveProfileFeatureFlags(profile);
  return { ...base, ...active };
}
