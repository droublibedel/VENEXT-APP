"use client";

import type { TerritoryIntelligenceResponse } from "@venext/shared-contracts";

export function TerritoryIntelligenceSurface({ data }: { data: TerritoryIntelligenceResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Territory intelligence</p>
      <p className="mt-1 text-slate-400">{data.narrative}</p>
      <ul className="mt-2 font-mono text-[11px] text-emerald-200/90">
        {data.fragileTerritories.map((t) => (
          <li key={t.territoryCode}>
            {t.territoryCode} · {t.fragilityScore.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
