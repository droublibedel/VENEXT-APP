export type {
  CommerceEmptyStateKey,
  CommerceErrorStateKey,
  CommerceUxActorKind,
  CommerceUxHarmonyFlags,
  CommerceUxPlatform,
} from "./commerce-ux-harmony.types";

export {
  getEmptyStateMessage,
} from "./commerce-ux-empty-messages";
export {
  getErrorStateMessage,
} from "./commerce-ux-error-messages";
export {
  auditVisibleCopy,
  harmonizeVisibleCopy,
} from "./commerce-ux-wording-audit";
export {
  evaluateNavigationHarmony,
  maxQuickActionsForPlatform,
} from "./commerce-ux-navigation-rules";
export {
  evaluateMobileSurfaceHarmony,
  mobileButtonStyle,
  MOBILE_MIN_TOUCH_PX,
} from "./commerce-ux-mobile-rules";
export {
  isCommerceUxHarmonyEnabled,
  resolveEmptyState,
  resolveErrorState,
  runCommerceUxHarmonyAudit,
} from "./commerce-ux-audit";

export { commerceFoundationCssVariables } from "commerce-foundation-guardrails";

export { VenextCommerceEmptyState } from "./VenextCommerceEmptyState";
export type { VenextCommerceEmptyStateProps } from "./VenextCommerceEmptyState";
export { VenextCommerceErrorState } from "./VenextCommerceErrorState";
export type { VenextCommerceErrorStateProps } from "./VenextCommerceErrorState";
export { VenextCommerceScreenHeader } from "./VenextCommerceScreenHeader";
export type { VenextCommerceScreenHeaderProps } from "./VenextCommerceScreenHeader";

export {
  VENEXT_SPACING,
  VENEXT_RADIUS,
  VENEXT_ELEVATION,
  VENEXT_TYPOGRAPHY,
  VENEXT_ICON_SIZE,
  VENEXT_FORM,
  VENEXT_SCREEN_PADDING,
  VENEXT_SKELETON_COLORS,
  VENEXT_TRANSITION,
  venextUnifiedDesignCssVariables,
} from "./design-system/venext-design-tokens";
export type { VenextRadiusToken, VenextSpacingToken } from "./design-system/venext-design-tokens";

export {
  VenextColorHierarchy,
  VenextSurfaceTokens,
  VenextEconomicAccentRules,
  VenextNavigationIconSystem,
  auditVenextColorOveruse,
  venextMobileIdentityCssVariables,
} from "./design-system/venext-mobile-identity";
export type {
  VenextColorOveruseInput,
  VenextColorOveruseIssue,
} from "./design-system/venext-mobile-identity";

export {
  VenextSkeletonBase,
  VenextSkeletonText,
  VenextSkeletonCard,
  VenextSkeletonList,
  VenextSkeletonTable,
  VenextSkeletonChart,
  VenextSkeletonMessage,
  VenextSkeletonDashboard,
  VenextSkeletonForm,
  VenextSkeletonProduct,
  VenextSkeletonOrder,
  VenextSkeletonPole,
  VenextSkeletonWallet,
  VenextSkeletonNotification,
  resolveVenextSkeletonForScreen,
} from "./skeleton/venext-skeleton-system";
export type { VenextSkeletonBaseProps } from "./skeleton/VenextSkeletonBase";
export type { VenextSkeletonScreenVariant } from "./skeleton/venext-skeleton-system";
export { VenextSkeletonScreen } from "./skeleton/VenextSkeletonScreen";
export type { VenextSkeletonScreenProps } from "./skeleton/VenextSkeletonScreen";

export {
  auditVenextVisualConsistency,
  validateVenextDesignTokenIntegrity,
} from "./audit/venext-visual-audit";
export type { VenextVisualAuditIssue } from "./audit/venext-visual-audit";
export {
  VenextColorTokens,
  legacyDarkGreenSurface,
  auditVenextForbiddenDarkGreenUsage,
  auditVenextTextContrast,
  auditVenextDemoDataIntegrity,
} from "./audit/venext-global-correction-audit";
export type {
  VenextDemoDataIntegrityIssue,
  VenextDemoDataSnapshot,
  VenextForbiddenColorIssue,
  VenextSourceMap,
  VenextTextContrastCheck,
  VenextTextContrastIssue,
} from "./audit/venext-global-correction-audit";
export { auditVisualFatigueRisk } from "./audit/venext-fatigue-audit";
export type { VenextFatigueAuditIssue } from "./audit/venext-fatigue-audit";
export { auditVenextUiPolish } from "./audit/venext-ui-polish-audit";
export type { VenextUiPolishIssue } from "./audit/venext-ui-polish-audit";

export { VenextUnifiedDesignSystem } from "./design-system/venext-unified-design-system";
export { VenextSkeletonSystem } from "./skeleton/venext-skeleton-system-facade";

export { VenextTerrainMobileHeader } from "./VenextTerrainMobileHeader";
export type { VenextTerrainMobileHeaderProps } from "./VenextTerrainMobileHeader";
export { VenextTerrainGlobalSearch } from "./VenextTerrainGlobalSearch";
export type {
  TerrainSearchResult,
  TerrainSearchResponse,
  VenextTerrainGlobalSearchProps,
} from "./VenextTerrainGlobalSearch";

export { EnterpriseAuthExperience } from "./auth/EnterpriseAuthExperience";
export { EnterpriseAuthVisual } from "./auth/EnterpriseAuthVisual";
export type { EnterpriseAuthExperienceProps } from "./auth/EnterpriseAuthExperience";
