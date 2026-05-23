"use client";

import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { isEconomicCommandSliceMissing } from "./economic-command-fallback-build";

export function EconomicSystemStressSurface({ bundle }: { bundle: EconomicCommandBundle | null }) {
  if (isEconomicCommandSliceMissing(bundle, "stress")) {
    return (
      <div className="rounded border border-amber-900/45 bg-amber-950/25 p-2 text-[11px] text-amber-100/90">
        Tranche <span className="font-mono">stress</span> indisponible — panneau non hydraté depuis le serveur.
      </div>
    );
  }
  const s = bundle?.systemStress;
  if (!s) {
    return (
      <div className="rounded border border-slate-800/80 bg-slate-950/60 p-2 text-[11px] text-slate-500">
        Stress systémique indisponible.
      </div>
    );
  }
  const rows: [string, number][] = [
    ["Global", s.globalStress],
    ["Logistique", s.logisticsStress],
    ["Financier", s.financialStress],
    ["Relationnel", s.relationshipStress],
    ["Coordination", s.coordinationStress],
    ["Silencieux", s.silentStress],
    ["Scénarios", s.scenarioStress],
  ];
  return (
    <section className="rounded border border-amber-900/35 bg-slate-950/70 p-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">Stress systémique (proxy)</h3>
      <p className="mt-1 text-[10px] text-slate-500">
        Mode {s.stressMode} — {s.explanation}
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-300 md:grid-cols-3">
        {rows.map(([k, v]) => (
          <li key={k} className="rounded border border-slate-800/70 bg-black/35 px-2 py-1">
            <span className="text-slate-500">{k}</span>
            <span className="ml-2 font-mono text-cyan-200/90">{v.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[9px] text-amber-200/80">Signaux proxy — bornés 0–1 — non prévision calibrée</p>
    </section>
  );
}
