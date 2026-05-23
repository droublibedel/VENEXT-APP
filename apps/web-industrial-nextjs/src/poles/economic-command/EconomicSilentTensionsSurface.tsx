"use client";

import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

export function EconomicSilentTensionsSurface({ bundle }: { bundle: EconomicCommandBundle | null }) {
  if (isEconomicCommandSliceMissing(bundle, "tensions")) {
    return (
      <div className="rounded border border-amber-900/45 bg-amber-950/25 p-2 text-[11px] text-amber-100/90">
        Tranche <span className="font-mono">tensions</span> indisponible — panneau non hydraté depuis le serveur.
      </div>
    );
  }
  if (!bundle?.silentTensions?.length) {
    return (
      <div className="rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px] text-slate-500">
        Pas de tension silencieuse détectée sur ce pas de temps.
      </div>
    );
  }
  return (
    <section className="rounded border border-slate-700/80 bg-slate-950/70 p-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">Tensions silencieuses</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {bundle.silentTensions.map((t) => (
          <li key={t.tensionId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
            <span className="font-medium text-slate-100">{t.tensionType}</span>
            <span className="ml-2 font-mono text-[10px] text-slate-500">
              I {t.intensity.toFixed(2)} · conf {t.confidence.toFixed(2)}
            </span>
            <p className="mt-0.5 text-[10px] text-slate-400">{t.explanation}</p>
            <p className="mt-0.5 text-[9px] text-amber-200/80">Heuristique</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
