import type { VenextLocale } from "./venext-i18n.types";
import { VENEXT_LOCALES } from "./venext-i18n.types";

const STORAGE_KEY = "venext.locale";

export function isVenextLocale(value: string): value is VenextLocale {
  return (VENEXT_LOCALES as readonly string[]).includes(value);
}

export function readStoredLocale(): VenextLocale | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isVenextLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredLocale(locale: VenextLocale): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
