"use client";

import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

export function EconomicDecisionRisksSurface({ bundle }: { bundle: EconomicCommandBundle | null }) {
  if (isEconomicCommandSliceMissing(bundle, "risks")) {
    return (
      <div className="rounded border border-amber-900/45 bg-amber-950/25 p-2 text-[11px] text-amber-100/90">
        Tranche <span className="font-mono">risks</span> indisponible — panneau non hydraté depuis le serveur.
      </div>
    );
  }
  if (!bundle?.decisionRisks?.length) {
    return (
      <div className="rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px] text-slate-500">
        Aucun risque décisionnel consultatif signalé.
      </div>
    );
  }
  return (
    <section className="rounded border border-rose-900/35 bg-slate-950/70 p-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-rose-200/90">Risques décisionnels (avertissement)</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {bundle.decisionRisks.map((r) => (
          <li key={r.riskId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
            <span className="font-medium text-rose-100/90">{r.decisionLabel}</span>
            <p className="mt-0.5 text-[10px] text-slate-400">{r.riskReason}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{r.explanation}</p>
            <p className="mt-0.5 text-[9px] text-amber-200/80">Consultatif — pas une interdiction</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
