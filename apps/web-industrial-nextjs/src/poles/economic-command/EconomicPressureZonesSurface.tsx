"use client";

import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

export function EconomicPressureZonesSurface({ bundle }: { bundle: EconomicCommandBundle | null }) {
  if (isEconomicCommandSliceMissing(bundle, "pressure-zones")) {
    return (
      <div className="rounded border border-amber-900/45 bg-amber-950/25 p-2 text-[11px] text-amber-100/90">
        Tranche <span className="font-mono">pressure-zones</span> indisponible — panneau non hydraté depuis le serveur.
      </div>
    );
  }
  if (!bundle?.pressureZones?.length) {
    return (
      <div className="rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px] text-slate-500">
        Aucune zone de pression heuristique sur cette fenêtre.
      </div>
    );
  }
  return (
    <section className="rounded border border-cyan-900/40 bg-slate-950/70 p-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/90">Zones de pression</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {bundle.pressureZones.map((z) => (
          <li key={z.zoneId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
            <span className="font-medium text-cyan-100/90">{z.label}</span>
            <span className="ml-2 font-mono text-[10px] text-slate-500">
              score {z.pressureScore.toFixed(2)} · poids {z.systemicWeight.toFixed(2)}
            </span>
            <p className="mt-0.5 text-[10px] text-slate-400">{z.explanation}</p>
            <p className="mt-0.5 text-[9px] text-amber-200/80">Heuristique seule — non opérationnel</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
