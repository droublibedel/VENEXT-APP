import type { ReactNode } from "react";

import { VenextLocaleProvider } from "venext-i18n";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";

export function GrossisteAVenextLocale({ children }: { children: ReactNode }) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const isDev = import.meta.env.DEV;

  if (!hydrated || flags.venext_i18n_enabled === false) {
    return <>{children}</>;
  }

  return (
    <VenextLocaleProvider
      flags={{
        venext_i18n_enabled: flags.venext_i18n_enabled,
        venext_rtl_enabled: flags.venext_rtl_enabled,
        venext_multilingual_guardrails_enabled: flags.venext_multilingual_guardrails_enabled,
      }}
      isDev={isDev}
    >
      {children}
    </VenextLocaleProvider>
  );
}
