import { COMMERCE_ERROR_CATALOG_FR } from "./commerce-error-catalog";
import {
  COMMERCE_ERROR_CRITICAL_AR,
  COMMERCE_ERROR_CRITICAL_ZH,
} from "./commerce-error-i18n-critical";
import type { CommerceErrorKey } from "./commerce-humanized-errors.types";

const EN: Partial<Record<CommerceErrorKey, { title: string; message: string }>> = {
  network_unstable: {
    title: "Unstable connection",
    message: "The connection seems unstable. Check your internet and try again.",
  },
  not_found: {
    title: "Information unavailable",
    message: "This information is not available right now.",
  },
  server_error: {
    title: "Service temporarily unavailable",
    message: "A temporary issue occurred. Please try again shortly.",
  },
  generic: {
    title: "Action unavailable",
    message: "This action is not available right now. Please try again.",
  },
};

const AR = COMMERCE_ERROR_CRITICAL_AR;
const ZH = COMMERCE_ERROR_CRITICAL_ZH;

function resolveLocaleDict(locale: string): Record<CommerceErrorKey, { title: string; message: string }> {
  const base = { ...COMMERCE_ERROR_CATALOG_FR };
  const lang = locale.split("-")[0]?.toLowerCase() ?? "fr";
  if (lang === "en") {
    return { ...base, ...EN } as typeof base;
  }
  if (lang === "ar") {
    return { ...base, ...AR } as typeof base;
  }
  if (lang === "zh") {
    return { ...base, ...ZH } as typeof base;
  }
  return base;
}

export function getHumanizedErrorCopy(
  key: CommerceErrorKey,
  locale = "fr-CI",
): { title: string; message: string } {
  const dict = resolveLocaleDict(locale);
  return dict[key] ?? dict.generic;
}
