/** VenextUnifiedDesignSystem — tokens officiels (Instruction 20.87). */

export const VENEXT_SPACING = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
} as const;

export const VENEXT_RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const VENEXT_ELEVATION = {
  none: "none",
  sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
  md: "0 4px 12px rgba(15, 23, 42, 0.08)",
  lg: "0 8px 24px rgba(15, 23, 42, 0.1)",
} as const;

export const VENEXT_TYPOGRAPHY = {
  display: { fontSize: 28, lineHeight: 1.2, fontWeight: 700 },
  heading: { fontSize: 22, lineHeight: 1.25, fontWeight: 700 },
  section: { fontSize: 17, lineHeight: 1.35, fontWeight: 600 },
  body: { fontSize: 15, lineHeight: 1.5, fontWeight: 400 },
  caption: { fontSize: 13, lineHeight: 1.45, fontWeight: 400 },
  label: { fontSize: 12, lineHeight: 1.4, fontWeight: 600 },
} as const;

export const VENEXT_ICON_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const VENEXT_FORM = {
  fieldMinHeight: 48,
  fieldGap: VENEXT_SPACING[12],
  sectionGap: VENEXT_SPACING[24],
} as const;

export const VENEXT_SCREEN_PADDING = {
  mobileHorizontal: VENEXT_SPACING[16],
  webGutter: VENEXT_SPACING[24],
  webMaxWidth: 1280,
} as const;

export const VENEXT_SKELETON_COLORS = {
  base: "var(--venext-skeleton-base, #e8edf2)",
  highlight: "var(--venext-skeleton-highlight, #f4f7fa)",
} as const;

export const VENEXT_TRANSITION = {
  fast: "150ms ease",
  normal: "220ms ease",
  slow: "320ms ease",
} as const;

export type VenextRadiusToken = keyof typeof VENEXT_RADIUS;
export type VenextSpacingToken = keyof typeof VENEXT_SPACING;

/** Variables CSS pour injection globale. */
export function venextUnifiedDesignCssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(VENEXT_SPACING)) {
    vars[`--venext-spacing-${k}`] = `${v}px`;
  }
  for (const [k, v] of Object.entries(VENEXT_RADIUS)) {
    vars[`--venext-radius-${k}`] = `${v}px`;
  }
  for (const [k, v] of Object.entries(VENEXT_TYPOGRAPHY)) {
    const t = v as { fontSize: number; lineHeight: number; fontWeight: number };
    vars[`--venext-type-${k}-size`] = `${t.fontSize}px`;
    vars[`--venext-type-${k}-line`] = String(t.lineHeight);
    vars[`--venext-type-${k}-weight`] = String(t.fontWeight);
  }
  vars["--venext-screen-padding-mobile"] = `${VENEXT_SCREEN_PADDING.mobileHorizontal}px`;
  vars["--venext-screen-padding-web"] = `${VENEXT_SCREEN_PADDING.webGutter}px`;
  vars["--venext-screen-max-width"] = `${VENEXT_SCREEN_PADDING.webMaxWidth}px`;
  return vars;
}
