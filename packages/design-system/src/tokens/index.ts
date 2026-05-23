import { venextPalette } from "./colors";
import { densityProfiles } from "./density";
import { elevation, radius, space } from "./space";
import { fontStacks, typographyScale } from "./typography";

/** Canonical token object for programmatic styling in components. */
export const venextTokens = {
  color: venextPalette,
  space,
  radius,
  elevation,
  font: fontStacks,
  typeScale: typographyScale,
  density: densityProfiles,
} as const;

export type VenextTokens = typeof venextTokens;
export * from "./colors";
export * from "./typography";
export * from "./space";
export * from "./density";
