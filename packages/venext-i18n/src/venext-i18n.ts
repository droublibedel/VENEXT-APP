import { guardTranslationOutput } from "./venext-translation-guard";
import {
  actorRoleToTranslationKey,
  localeToFolder,
  type VenextActorRole,
  type VenextDictionary,
  type VenextI18nFlags,
  type VenextI18nRuntime,
  type VenextLocale,
  type VenextRelationshipType,
  type VenextTranslationDomain,
  type VenextTranslationParams,
} from "./venext-i18n.types";
import { getLocaleDirection } from "./venext-rtl";
import { createVenextFormatters } from "./venext-formatters";

type DomainCacheKey = `${VenextLocale}:${VenextTranslationDomain}`;

const domainLoaders: Record<
  VenextLocale,
  Record<VenextTranslationDomain, () => Promise<{ default: VenextDictionary }>>
> = {
  "fr-CI": {
    common: () => import("./locales/fr/common.json"),
    navigation: () => import("./locales/fr/navigation.json"),
    onboarding: () => import("./locales/fr/onboarding.json"),
    identity: () => import("./locales/fr/identity.json"),
    relationship: () => import("./locales/fr/relationship.json"),
    catalog: () => import("./locales/fr/catalog.json"),
    orders: () => import("./locales/fr/orders.json"),
    delivery: () => import("./locales/fr/delivery.json"),
    wallet: () => import("./locales/fr/wallet.json"),
    messaging: () => import("./locales/fr/messaging.json"),
    mail: () => import("./locales/fr/mail.json"),
    notifications: () => import("./locales/fr/notifications.json"),
    errors: () => import("./locales/fr/errors.json"),
    guardrails: () => import("./locales/fr/guardrails.json"),
  },
  en: {
    common: () => import("./locales/en/common.json"),
    navigation: () => import("./locales/en/navigation.json"),
    onboarding: () => import("./locales/en/onboarding.json"),
    identity: () => import("./locales/en/identity.json"),
    relationship: () => import("./locales/en/relationship.json"),
    catalog: () => import("./locales/en/catalog.json"),
    orders: () => import("./locales/en/orders.json"),
    delivery: () => import("./locales/en/delivery.json"),
    wallet: () => import("./locales/en/wallet.json"),
    messaging: () => import("./locales/en/messaging.json"),
    mail: () => import("./locales/en/mail.json"),
    notifications: () => import("./locales/en/notifications.json"),
    errors: () => import("./locales/en/errors.json"),
    guardrails: () => import("./locales/en/guardrails.json"),
  },
  ar: {
    common: () => import("./locales/ar/common.json"),
    navigation: () => import("./locales/ar/navigation.json"),
    onboarding: () => import("./locales/ar/onboarding.json"),
    identity: () => import("./locales/ar/identity.json"),
    relationship: () => import("./locales/ar/relationship.json"),
    catalog: () => import("./locales/ar/catalog.json"),
    orders: () => import("./locales/ar/orders.json"),
    delivery: () => import("./locales/ar/delivery.json"),
    wallet: () => import("./locales/ar/wallet.json"),
    messaging: () => import("./locales/ar/messaging.json"),
    mail: () => import("./locales/ar/mail.json"),
    notifications: () => import("./locales/ar/notifications.json"),
    errors: () => import("./locales/ar/errors.json"),
    guardrails: () => import("./locales/ar/guardrails.json"),
  },
  "zh-CN": {
    common: () => import("./locales/zh/common.json"),
    navigation: () => import("./locales/zh/navigation.json"),
    onboarding: () => import("./locales/zh/onboarding.json"),
    identity: () => import("./locales/zh/identity.json"),
    relationship: () => import("./locales/zh/relationship.json"),
    catalog: () => import("./locales/zh/catalog.json"),
    orders: () => import("./locales/zh/orders.json"),
    delivery: () => import("./locales/zh/delivery.json"),
    wallet: () => import("./locales/zh/wallet.json"),
    messaging: () => import("./locales/zh/messaging.json"),
    mail: () => import("./locales/zh/mail.json"),
    notifications: () => import("./locales/zh/notifications.json"),
    errors: () => import("./locales/zh/errors.json"),
    guardrails: () => import("./locales/zh/guardrails.json"),
  },
};

const dictionaries = new Map<DomainCacheKey, VenextDictionary>();
const loadingPromises = new Map<DomainCacheKey, Promise<VenextDictionary>>();

function deepMerge(target: VenextDictionary, source: VenextDictionary): VenextDictionary {
  const out: VenextDictionary = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const prev = out[key];
      out[key] =
        prev && typeof prev === "object" && !Array.isArray(prev)
          ? deepMerge(prev as VenextDictionary, value as VenextDictionary)
          : value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function getFromPath(dict: VenextDictionary, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as VenextDictionary)[part];
  }
  return cur;
}

function interpolate(template: string, params?: VenextTranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? "" : String(value);
  });
}

function prodSafeMissing(key: string, isDev: boolean): string {
  if (isDev) return `[${key}]`;
  return "…";
}

export async function loadTranslationDomain(
  locale: VenextLocale,
  domain: VenextTranslationDomain,
): Promise<VenextDictionary> {
  const cacheKey: DomainCacheKey = `${locale}:${domain}`;
  const cached = dictionaries.get(cacheKey);
  if (cached) return cached;

  let pending = loadingPromises.get(cacheKey);
  if (!pending) {
    pending = domainLoaders[locale][domain]().then((mod) => {
      const data = mod.default ?? mod;
      dictionaries.set(cacheKey, data);
      loadingPromises.delete(cacheKey);
      return data;
    });
    loadingPromises.set(cacheKey, pending);
  }
  return pending;
}

export async function preloadVenextDomains(
  locale: VenextLocale,
  domains: VenextTranslationDomain[],
): Promise<void> {
  await Promise.all(domains.map((d) => loadTranslationDomain(locale, d)));
}

export function buildMergedDictionary(locale: VenextLocale): VenextDictionary {
  let merged: VenextDictionary = {};
  for (const key of dictionaries.keys()) {
    if (!key.startsWith(`${locale}:`)) continue;
    const dict = dictionaries.get(key);
    if (dict) merged = deepMerge(merged, dict);
  }
  return merged;
}

export function createVenextI18n(options: {
  locale: VenextLocale;
  flags?: VenextI18nFlags;
  isDev?: boolean;
  onLocaleChange?: (locale: VenextLocale) => void;
}): VenextI18nRuntime {
  let locale = options.locale;
  const flags = options.flags ?? {};
  const isDev = options.isDev ?? false;

  const t = (key: string, params?: VenextTranslationParams): string => {
    const locales: VenextLocale[] = [locale, "fr-CI"];
    for (const loc of locales) {
      const merged = buildMergedDictionary(loc);
      const value = getFromPath(merged, key);
      if (typeof value === "string") {
        return guardTranslationOutput(interpolate(value, params), loc, flags);
      }
    }
    return prodSafeMissing(key, isDev);
  };

  const tActor = (
    key: string,
    ctx: { actorRole: VenextActorRole } & VenextTranslationParams,
  ): string => {
    const actorKey = actorRoleToTranslationKey(ctx.actorRole);
    const fullKey = `actor.${actorKey}.${key}`;
    return t(fullKey, ctx);
  };

  const tRelationship = (
    key: string,
    ctx: { relationshipType: VenextRelationshipType } & VenextTranslationParams,
  ): string => {
    const fullKey = `${ctx.relationshipType}.${key}`;
    return t(fullKey, ctx);
  };

  return {
    locale,
    direction: getLocaleDirection(locale),
    flags,
    isDev,
    t,
    tActor,
    tRelationship,
    loadDomain: (domain) => loadTranslationDomain(locale, domain).then(() => undefined),
    setLocale: (next) => {
      locale = next;
      options.onLocaleChange?.(next);
    },
  };
}

export function localeFolderForImport(locale: VenextLocale): string {
  return localeToFolder(locale);
}
