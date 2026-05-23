"use client";

import type { TerritoryActivationRadarResponse } from "@venext/shared-contracts";

export function TerritoryActivationRadar({ data }: { data: TerritoryActivationRadarResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-violet-900/25 bg-slate-950/40 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-200/90">Territory activation radar</p>
        <p className="text-[11px] text-slate-500">Rising vs dormant stimulation — orders × negotiations × sponsor spread.</p>
        {data.seasonalPressure ? (
          <p className="mt-1 text-[10px] text-amber-200/85">
            MOCK_CONTEXT seasonal overlay · intensity {data.seasonalPressure.intensity.toFixed(2)} — blended into stimulation scores.
          </p>
        ) : null}
      </header>
      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded border border-emerald-900/40 bg-emerald-950/30 px-2 py-0.5 text-emerald-100/90">
          Rising: {data.risingCorridors.slice(0, 4).join(" · ") || "—"}
        </span>
        <span className="rounded border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-slate-300">
          Dormant: {data.dormantRegions.slice(0, 4).join(" · ") || "—"}
        </span>
      </div>
      <ul className="max-h-48 space-y-1 overflow-y-auto text-[11px]">
        {data.rows.slice(0, 12).map((r) => (
          <li key={r.territoryKey} className="flex justify-between gap-2 rounded border border-slate-800/60 px-2 py-1">
            <span className="text-slate-200">{r.label}</span>
            <span className="font-mono text-violet-200/90">{r.stimulationScore.toFixed(2)}</span>
            <span className="text-[9px] uppercase text-slate-500">{r.state}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
