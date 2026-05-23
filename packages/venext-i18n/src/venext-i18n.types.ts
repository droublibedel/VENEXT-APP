export type VenextLocale = "fr-CI" | "en" | "ar" | "zh-CN";

export type VenextLocaleFolder = "fr" | "en" | "ar" | "zh";

export type VenextDirection = "ltr" | "rtl";

export type VenextTranslationDomain =
  | "common"
  | "navigation"
  | "onboarding"
  | "identity"
  | "relationship"
  | "catalog"
  | "orders"
  | "delivery"
  | "wallet"
  | "messaging"
  | "mail"
  | "notifications"
  | "errors"
  | "guardrails";

export type VenextActorRole = "producteur" | "grossiste_a" | "grossiste_b" | "detaillant";

export type VenextActorTranslationKey = "producer" | "grossisteA" | "grossisteB" | "detaillant";

export type VenextRelationshipType =
  | "formal"
  | "terrain"
  | "hybrid"
  | "contactFirst"
  | "partnerOnly";

export type VenextI18nFlags = {
  venext_i18n_enabled?: boolean;
  venext_rtl_enabled?: boolean;
  venext_multilingual_guardrails_enabled?: boolean;
};

export type VenextTranslationParams = Record<string, string | number | boolean | undefined>;

export type VenextTranslateFn = (
  key: string,
  params?: VenextTranslationParams,
) => string;

export type VenextActorTranslateFn = (
  key: string,
  ctx: { actorRole: VenextActorRole } & VenextTranslationParams,
) => string;

export type VenextRelationshipTranslateFn = (
  key: string,
  ctx: { relationshipType: VenextRelationshipType } & VenextTranslationParams,
) => string;

export type VenextDictionary = Record<string, unknown>;

export type VenextI18nRuntime = {
  locale: VenextLocale;
  direction: VenextDirection;
  flags: VenextI18nFlags;
  isDev: boolean;
  t: VenextTranslateFn;
  tActor: VenextActorTranslateFn;
  tRelationship: VenextRelationshipTranslateFn;
  loadDomain: (domain: VenextTranslationDomain) => Promise<void>;
  setLocale: (locale: VenextLocale) => void;
};

export const VENEXT_LOCALES: readonly VenextLocale[] = ["fr-CI", "en", "ar", "zh-CN"] as const;

export const VENEXT_DOMAINS: readonly VenextTranslationDomain[] = [
  "common",
  "navigation",
  "onboarding",
  "identity",
  "relationship",
  "catalog",
  "orders",
  "delivery",
  "wallet",
  "messaging",
  "mail",
  "notifications",
  "errors",
  "guardrails",
] as const;

export function localeToFolder(locale: VenextLocale): VenextLocaleFolder {
  if (locale === "fr-CI") return "fr";
  if (locale === "zh-CN") return "zh";
  return locale;
}

export function actorRoleToTranslationKey(role: VenextActorRole): VenextActorTranslationKey {
  switch (role) {
    case "producteur":
      return "producer";
    case "grossiste_a":
      return "grossisteA";
    case "grossiste_b":
      return "grossisteB";
    case "detaillant":
      return "detaillant";
    default:
      return "detaillant";
  }
}
