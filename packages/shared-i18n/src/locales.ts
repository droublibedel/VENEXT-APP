export const VENEXT_LOCALES = ["fr", "en", "ar", "zh"] as const;
export type VenextLocale = (typeof VENEXT_LOCALES)[number];

export type I18nNamespace =
  | "commerce.core"
  | "commerce.relationships"
  | "commerce.wallet"
  | "roles.terminology"
  | "geo.signals";
