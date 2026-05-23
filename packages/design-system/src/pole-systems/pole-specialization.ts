/**
 * Each industrial pole ships its own:
 * - map overlay recipe
 * - command lexicon
 * - density + motion profile
 * - data widgets (never a generic dashboard grid)
 */
export interface PoleSpecializationProfile {
  poleId: string;
  commandLexicon: string[];
  mapOverlayRecipe: string[];
  density: "industrialDense";
}

export function createPoleProfile(
  partial: Partial<PoleSpecializationProfile> & { poleId: string },
): PoleSpecializationProfile {
  return {
    poleId: partial.poleId,
    commandLexicon: partial.commandLexicon ?? ["route", "buffer", "commit"],
    mapOverlayRecipe: partial.mapOverlayRecipe ?? ["logistics", "safety"],
    density: "industrialDense",
  };
}
