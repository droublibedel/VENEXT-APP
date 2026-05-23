import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { resolveInitialLocale } from "./venext-locale-detection";
import { writeStoredLocale } from "./venext-locale-storage";
import {
  buildMergedDictionary,
  createVenextI18n,
  loadTranslationDomain,
  preloadVenextDomains,
} from "./venext-i18n";
import { applyLocaleDirection } from "./venext-rtl";
import { createVenextFormatters } from "./venext-formatters";
import {
  actorRoleToTranslationKey,
  type VenextActorRole,
  type VenextI18nFlags,
  type VenextI18nRuntime,
  type VenextLocale,
  type VenextRelationshipType,
  VENEXT_DOMAINS,
} from "./venext-i18n.types";
import { isVenextI18nEnabled } from "./venext-translation-guard";

const VenextLocaleCtx = createContext<VenextI18nRuntime | null>(null);

const DEFAULT_PRELOAD: typeof VENEXT_DOMAINS[number][] = ["common", "navigation", "errors"];

export const VenextLocaleProvider = memo(function VenextLocaleProvider({
  children,
  initialLocale,
  flags = {},
  isDev = false,
  preloadDomains = DEFAULT_PRELOAD,
}: {
  children: ReactNode;
  initialLocale?: VenextLocale;
  flags?: VenextI18nFlags;
  isDev?: boolean;
  preloadDomains?: typeof VENEXT_DOMAINS[number][];
}) {
  const [locale, setLocaleState] = useState<VenextLocale>(() =>
    resolveInitialLocale(initialLocale),
  );
  const [ready, setReady] = useState(false);

  const runtime = useMemo(
    () =>
      createVenextI18n({
        locale,
        flags,
        isDev,
        onLocaleChange: (next) => {
          writeStoredLocale(next);
          if (typeof document !== "undefined" && flags.venext_rtl_enabled !== false) {
            applyLocaleDirection(next);
          }
        },
      }),
    [locale, flags, isDev],
  );

  useEffect(() => {
    if (!isVenextI18nEnabled(flags)) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      await preloadVenextDomains(locale, preloadDomains);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, flags, preloadDomains]);

  useEffect(() => {
    if (flags.venext_rtl_enabled === false) return;
    if (typeof document !== "undefined") applyLocaleDirection(locale);
  }, [locale, flags.venext_rtl_enabled]);

  const setLocale = useCallback(
    async (next: VenextLocale) => {
      setLocaleState(next);
      runtime.setLocale(next);
      await preloadVenextDomains(next, preloadDomains);
    },
    [runtime, preloadDomains],
  );

  const value = useMemo(
    (): VenextI18nRuntime => ({
      ...runtime,
      locale,
      setLocale: (next) => {
        void setLocale(next);
      },
    }),
    [runtime, locale, setLocale],
  );

  if (!ready && isVenextI18nEnabled(flags)) {
    return (
      <div data-testid="venext-i18n-loading" style={{ padding: 8, fontSize: 13, opacity: 0.7 }}>
        {runtime.t("app.loading")}
      </div>
    );
  }

  return <VenextLocaleCtx.Provider value={value}>{children}</VenextLocaleCtx.Provider>;
});

function useRuntime(): VenextI18nRuntime {
  const ctx = useContext(VenextLocaleCtx);
  if (!ctx) {
    return createVenextI18n({ locale: "fr-CI", isDev: false });
  }
  return ctx;
}

export function useVenextLocale(): {
  locale: VenextLocale;
  setLocale: (locale: VenextLocale) => void;
  direction: VenextI18nRuntime["direction"];
} {
  const rt = useRuntime();
  return {
    locale: rt.locale,
    setLocale: rt.setLocale,
    direction: rt.direction,
  };
}

export function useVenextT(): VenextI18nRuntime["t"] {
  return useRuntime().t;
}

export function useVenextDirection(): VenextI18nRuntime["direction"] {
  return useRuntime().direction;
}

export function useVenextFormatter() {
  const { locale } = useVenextLocale();
  return useMemo(() => createVenextFormatters(locale), [locale]);
}

export function useActorTranslationContext(actorRole: VenextActorRole) {
  const t = useVenextT();
  const actorKey = actorRoleToTranslationKey(actorRole);
  return useMemo(
    () => ({
      actorRole,
      actorKey,
      tActor: (key: string, params?: Record<string, string | number | boolean | undefined>) =>
        t(`actor.${actorKey}.${key}`, params),
    }),
    [t, actorRole, actorKey],
  );
}

export function useRelationshipTranslationContext(relationshipType: VenextRelationshipType) {
  const t = useVenextT();
  return useMemo(
    () => ({
      relationshipType,
      tRelationship: (key: string, params?: Record<string, string | number | boolean | undefined>) =>
        t(`${relationshipType}.${key}`, params),
    }),
    [t, relationshipType],
  );
}

export async function ensureVenextDomainLoaded(
  locale: VenextLocale,
  domain: (typeof VENEXT_DOMAINS)[number],
): Promise<void> {
  await loadTranslationDomain(locale, domain);
}

export { buildMergedDictionary };
