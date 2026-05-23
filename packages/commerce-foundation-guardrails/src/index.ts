export {
  sanitizeCommerceFoundationText,
  containsForbiddenEnterpriseWording,
  assertCommerceFoundationWording,
  isCommerceAntiErpWordingEnabled,
} from "./commerce-foundation-wording.guard";

export {
  sanitizeTranslatedCommerceText,
  isMultilingualGuardrailsEnabled,
  type VenextLocaleTag,
} from "./commerce-multilingual-wording.guard";

export {
  type CommerceFoundationFlags,
  type CommerceActorKind,
  type CommerceActorRole,
  isCommerceFoundationGuardrailsEnabled,
  resolveCommerceActorKind,
  assertVenextCommercePhilosophy,
  commercePhilosophyReminder,
  isCommerceFirstSurface,
} from "./commerce-foundation-philosophy.guard";

export {
  type CommerceNavigationContext,
  type CommerceNavigationConsistency,
  buildCommerceNavigationConsistency,
  assertSingleActivePanel,
  mergeCommerceNavigationContext,
  isCommerceNavigationConsistencyEnabled,
} from "./commerce-foundation-navigation.guard";

export {
  type CommerceUxSurfaceInput,
  type CommerceUxGuardResult,
  evaluateCommerceUxSurface,
  maxPanelsForPlatform,
  assertUxNotAdministrative,
} from "./commerce-foundation-ux.guard";

export {
  type CommerceComplexityInput,
  type CommerceComplexityScore,
  buildCommerceComplexityScore,
} from "./commerce-foundation-complexity.guard";

export {
  assertDeliveryStaysLightweight,
  assertDeliveryUiAllowed,
  sanitizeDeliveryFoundationText,
  deliveryLightweightPrinciples,
} from "./commerce-delivery-lightweight.guard";

export {
  assertWalletNotFintech,
  sanitizeWalletFoundationText,
  walletPhilosophyLabels,
} from "./commerce-wallet-philosophy.guard";

export {
  type CommerceCommunicationChannel,
  resolveCommunicationChannel,
  assertCommunicationNotSocial,
  assertFormalUsesMailNotSocialFeed,
  assertTerrainUsesMessagingNotMailWizard,
  communicationSeparationHint,
} from "./commerce-communication.guard";

export {
  type CommercePlatform,
  type PlatformConsistencyInput,
  resolveExpectedPlatform,
  evaluatePlatformConsistency,
  platformDensityLabel,
} from "./commerce-platform-consistency.guard";

export {
  type CommerceQuickActionPattern,
  type CommerceInteractionSurface,
  normalizeQuickAction,
  buildStandardCommerceInteractionSurface,
  interactionPatternTestIds,
  assertInlineConfirmationOnly,
} from "./commerce-interaction-patterns";

export {
  type CommerceDesignTokens,
  resolveCommerceDesignTokens,
  panelDensityClass,
  commerceFoundationCssVariables,
  designRulesSummary,
} from "./commerce-foundation-design-rules";
