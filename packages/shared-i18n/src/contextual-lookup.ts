import type { VenextLocale } from "./locales.js";

/**
 * Commerce-aware, profession-aware keys — not literal translations.
 * Values are resolved per locale + role facet for wording adaptation.
 */
export interface ContextualMessageKey {
  namespace: string;
  key: string;
  /** Optional facet-specific terminology branch */
  facet?: string;
}

export type MessageBundle = Record<
  VenextLocale,
  Record<string, string | Record<string, string>>
>;
