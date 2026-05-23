"use client";

import dynamic from "next/dynamic";

import { ProducerAuthProvider } from "@/producer-industrial/auth/ProducerAuthProvider";
import { ProducerVenextLocale } from "@/producer-industrial/i18n/ProducerVenextLocale";
import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

const ProducerIndustrialAppShell = dynamic(
  () =>
    import("@/producer-industrial/app-shell/ProducerIndustrialAppShell").then(
      (m) => m.ProducerIndustrialAppShell,
    ),
  {
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-[#050608]">
        <VenextInlineSkeleton variant="dashboard" className="w-full max-w-lg p-8" />
      </div>
    ),
    ssr: false,
  },
);

export default function ProducerIndustrialPage() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = flags.producer_industrial_web_enabled !== false;

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#050608] text-sm text-slate-500">
        Initialisation politiques industrielles…
      </div>
    );
  }

  if (!enabled) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">VENEXT Producteur</p>
        <h1 className="text-xl font-semibold text-slate-200">Cockpit producteur non activé</h1>
        <p className="text-sm text-slate-500">
          Activez <span className="font-mono text-emerald-400/90">producer_industrial_web_enabled</span> pour accéder
          au premier produit terrain V1.
        </p>
      </main>
    );
  }

  return (
    <ProducerVenextLocale>
      <ProducerAuthProvider>
        <ProducerIndustrialAppShell />
      </ProducerAuthProvider>
    </ProducerVenextLocale>
  );
}
