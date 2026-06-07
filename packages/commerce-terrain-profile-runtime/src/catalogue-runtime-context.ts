import type { TerrainProfileId } from "./types.js";

export type CatalogueRuntimeMode = "wholesale_distribution" | "retail_procurement";

export type CatalogueRuntimeContext = {
  profile: TerrainProfileId;
  mode: CatalogueRuntimeMode;
  organizationId: string;
  profileContextId: string;
};

export function resolveCatalogueRuntimeMode(profile: TerrainProfileId): CatalogueRuntimeMode {
  return profile === "grossiste_b" ? "wholesale_distribution" : "retail_procurement";
}

export function buildCatalogueRuntimeContext(
  profile: TerrainProfileId,
  organizationId: string,
  profileContextId: string,
): CatalogueRuntimeContext {
  return {
    profile,
    mode: resolveCatalogueRuntimeMode(profile),
    organizationId,
    profileContextId,
  };
}

export function assertCatalogueProfileMatch(
  context: CatalogueRuntimeContext,
  activeProfile: TerrainProfileId | null,
): boolean {
  return activeProfile !== null && context.profile === activeProfile;
}
