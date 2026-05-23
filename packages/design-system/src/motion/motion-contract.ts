/**
 * Motion communicates state / activity / intelligence — never decoration.
 * Prefer transform + opacity; avoid blur, heavy shadows in motion keyframes.
 */
export const motionRules = {
  allowedProperties: ["transform", "opacity", "max-height"] as const,
  disallowedPatterns: [
    "bouncy-elastic",
    "overshoot-marketing",
    "parallax-hero",
  ] as const,
} as const;
