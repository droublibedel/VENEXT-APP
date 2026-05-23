import {
  VENEXT_ELEVATION,
  VENEXT_FORM,
  VENEXT_ICON_SIZE,
  VENEXT_RADIUS,
  VENEXT_SCREEN_PADDING,
  VENEXT_SKELETON_COLORS,
  VENEXT_SPACING,
  VENEXT_TRANSITION,
  VENEXT_TYPOGRAPHY,
  venextUnifiedDesignCssVariables,
} from "./venext-design-tokens";

/** Façade officielle VenextUnifiedDesignSystem (Instruction 20.87-A). */
export const VenextUnifiedDesignSystem = {
  spacing: VENEXT_SPACING,
  radius: VENEXT_RADIUS,
  elevation: VENEXT_ELEVATION,
  typography: VENEXT_TYPOGRAPHY,
  iconSize: VENEXT_ICON_SIZE,
  form: VENEXT_FORM,
  screenPadding: VENEXT_SCREEN_PADDING,
  skeletonColors: VENEXT_SKELETON_COLORS,
  transition: VENEXT_TRANSITION,
  cssVariables: venextUnifiedDesignCssVariables,
} as const;
