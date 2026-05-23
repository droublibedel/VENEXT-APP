"use client";

import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

export function EconomicArbitrationsSurface({ bundle }: { bundle: EconomicCommandBundle | null }) {
  if (isEconomicCommandSliceMissing(bundle, "arbitrations")) {
    return (
      <div className="rounded border border-amber-900/45 bg-amber-950/25 p-2 text-[11px] text-amber-100/90">
        Tranche <span className="font-mono">arbitrations</span> indisponible — panneau non hydraté depuis le serveur.
      </div>
    );
  }
  if (!bundle?.arbitrations?.length) {
    return (
      <div className="rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px] text-slate-500">
        Aucun arbitrage analytique matérialisé.
      </div>
    );
  }
  return (
    <section className="rounded border border-violet-900/40 bg-slate-950/70 p-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/90">Arbitrages analytiques</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {bundle.arbitrations.map((a) => (
          <li key={a.arbitrationId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
            <span className="font-medium text-violet-100/90">{a.arbitrationType}</span>
            <span className="ml-2 font-mono text-[10px] text-slate-500">tension {a.tensionScore.toFixed(2)}</span>
            <p className="mt-0.5 text-[10px] text-slate-400">{a.tradeoffExplanation}</p>
            <p className="mt-0.5 text-[10px] text-slate-300">
              Direction suggérée: {a.recommendedDirection}
              {a.executiveAttentionRequired ? " · attention exécutive" : ""}
            </p>
            <p className="mt-0.5 text-[9px] text-amber-200/80">Exécution non opérationnelle — lecture seule</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
