import type { VenextLocale } from "./venext-i18n.types";
import { readStoredLocale } from "./venext-locale-storage";

const REGION_FALLBACK: Record<string, VenextLocale> = {
  CI: "fr-CI",
  FR: "fr-CI",
  SN: "fr-CI",
  US: "en",
  GB: "en",
  AE: "ar",
  SA: "ar",
  MA: "ar",
  CN: "zh-CN",
  TW: "zh-CN",
};

function normalizeBrowserLocale(tag: string): VenextLocale | null {
  const lower = tag.toLowerCase();
  if (lower.startsWith("fr")) return "fr-CI";
  if (lower.startsWith("ar")) return "ar";
  if (lower.startsWith("zh")) return "zh-CN";
  if (lower.startsWith("en")) return "en";
  return null;
}

export function detectRegionLocale(): VenextLocale | null {
  if (typeof navigator === "undefined") return null;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of langs) {
    const normalized = normalizeBrowserLocale(tag);
    if (normalized) return normalized;
    const region = tag.split("-")[1]?.toUpperCase();
    if (region && REGION_FALLBACK[region]) return REGION_FALLBACK[region];
  }
  return null;
}

export function resolveInitialLocale(preferred?: VenextLocale | null): VenextLocale {
  if (preferred) return preferred;
  const stored = readStoredLocale();
  if (stored) return stored;
  const region = detectRegionLocale();
  if (region) return region;
  return "fr-CI";
}
