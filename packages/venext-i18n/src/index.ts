export type {
  VenextLocale,
  VenextLocaleFolder,
  VenextDirection,
  VenextTranslationDomain,
  VenextActorRole,
  VenextActorTranslationKey,
  VenextRelationshipType,
  VenextI18nFlags,
  VenextTranslationParams,
  VenextTranslateFn,
  VenextActorTranslateFn,
  VenextRelationshipTranslateFn,
  VenextDictionary,
  VenextI18nRuntime,
} from "./venext-i18n.types";

export {
  VENEXT_LOCALES,
  VENEXT_DOMAINS,
  localeToFolder,
  actorRoleToTranslationKey,
} from "./venext-i18n.types";

export {
  createVenextI18n,
  loadTranslationDomain,
  preloadVenextDomains,
  buildMergedDictionary,
  localeFolderForImport,
} from "./venext-i18n";

export {
  VenextLocaleProvider,
  useVenextLocale,
  useVenextT,
  useVenextDirection,
  useVenextFormatter,
  useActorTranslationContext,
  useRelationshipTranslationContext,
  ensureVenextDomainLoaded,
} from "./venext-locale-provider";

export { VenextLanguageSelector } from "./VenextLanguageSelector";

export { resolveInitialLocale, detectRegionLocale } from "./venext-locale-detection";
export { readStoredLocale, writeStoredLocale, isVenextLocale } from "./venext-locale-storage";
export { isRtlLocale, getLocaleDirection, applyLocaleDirection } from "./venext-rtl";
export { createVenextFormatters, type VenextFormatterSet } from "./venext-formatters";
export {
  isVenextI18nEnabled,
  isMultilingualGuardrailsEnabled,
  guardTranslationOutput,
  sanitizeTranslatedCommerceText,
} from "./venext-translation-guard";
export { VENEXT_BUSINESS_GLOSSARY } from "./venext-business-glossary";
