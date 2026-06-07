import type { TerrainProfileId } from "./types.js";
import { profileLabel } from "./types.js";

export type MessageBusinessContext =
  | "grossiste_distribution"
  | "retailer_procurement"
  | "mixed_relationship";

export function resolveMessageBusinessContext(profile: TerrainProfileId): MessageBusinessContext {
  return profile === "grossiste_b" ? "grossiste_distribution" : "retailer_procurement";
}

export function messageBusinessContextLabel(context: MessageBusinessContext): string {
  switch (context) {
    case "grossiste_distribution":
      return "Grossiste";
    case "retailer_procurement":
      return "Détaillant";
    case "mixed_relationship":
      return "Mixte";
  }
}

export function resolveMessageBusinessBadge(
  context: MessageBusinessContext | undefined,
  activeProfile: TerrainProfileId | null,
): string | null {
  if (context === "mixed_relationship") return "Mixte";
  if (context === "grossiste_distribution") return profileLabel("grossiste_b");
  if (context === "retailer_procurement") return profileLabel("detaillant");
  if (activeProfile) return profileLabel(activeProfile);
  return null;
}
