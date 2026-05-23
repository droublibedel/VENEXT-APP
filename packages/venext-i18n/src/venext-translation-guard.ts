import { sanitizeTranslatedCommerceText } from "commerce-foundation-guardrails";

import type { VenextI18nFlags, VenextLocale } from "./venext-i18n.types";

export function isVenextI18nEnabled(flags: VenextI18nFlags = {}): boolean {
  return flags.venext_i18n_enabled !== false;
}

export function isMultilingualGuardrailsEnabled(flags: VenextI18nFlags = {}): boolean {
  return flags.venext_multilingual_guardrails_enabled !== false;
}

export function guardTranslationOutput(
  text: string,
  locale: VenextLocale,
  flags: VenextI18nFlags = {},
): string {
  if (!text?.trim()) return text;
  if (!isMultilingualGuardrailsEnabled(flags)) return text.trim();
  return sanitizeTranslatedCommerceText(text, locale, flags);
}

export { sanitizeTranslatedCommerceText };
