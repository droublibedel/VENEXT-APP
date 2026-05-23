"use client";

import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

export function EconomicCommandNarrativeSurface({ bundle }: { bundle: EconomicCommandBundle | null }) {
  const n = bundle?.narrative;
  const sliceMissing = isEconomicCommandSliceMissing(bundle, "narrative");
  if (!n) {
    return (
      <div className="rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px] text-slate-500">
        Narratif exécutif indisponible.
      </div>
    );
  }
  return (
    <section className="rounded border border-slate-700/90 bg-black/50 p-2">
      {sliceMissing ? (
        <p className="mb-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-100/90">
          Tranche <span className="font-mono">narrative</span> non chargée — texte ci-dessous est un secours client.
        </p>
      ) : null}
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">Synthèse exécutive</h3>
      <p className="mt-1 text-[9px] font-mono text-slate-500">{n.narrativeMode}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-slate-200">
        {n.lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <p className="mt-2 text-[10px] text-amber-100/85">
        Avertissement: {n.executiveWarning}
      </p>
      <p className="mt-1 text-[10px] text-cyan-100/80">Focus recommandé (consultatif): {n.recommendedFocus}</p>
      <p className="mt-1 text-[9px] text-slate-500">{n.limitations}</p>
      <p className="mt-2 text-[9px] text-slate-600">
        Assemblage déterministe — pas de conversation, pas d’opérateur « IA », pas d’exécution métier.
      </p>
    </section>
  );
}
