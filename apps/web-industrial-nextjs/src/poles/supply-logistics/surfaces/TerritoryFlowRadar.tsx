"use client";

import type { TerritoryFlowResponse } from "@venext/shared-contracts";

export function TerritoryFlowRadar({ data, compact }: { data: TerritoryFlowResponse | undefined; compact?: boolean }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Territory flow disabled by <span className="font-mono text-slate-300">territory_flow_enabled</span>.
      </div>
    );
  }
  const cap = compact ? 5 : 10;
  return (
    <section className="space-y-2 rounded border border-cyan-900/30 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/85">Territory flow radar</p>
        <p className="text-[10px] text-amber-200/80">
          Overloaded: {data.overloadedTerritories.slice(0, 4).join(" · ") || "—"} · Weak:{" "}
          {data.weakSupplyTerritories.slice(0, 3).join(" · ") || "—"}
        </p>
      </header>
      <ul className={`${compact ? "max-h-28" : "max-h-40"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.cells.slice(0, cap).map((c) => (
          <li key={c.territoryKey} className="flex justify-between gap-2 border-b border-slate-800/50 py-1">
            <span className="text-slate-300">{c.label}</span>
            <span className="font-mono text-cyan-200/90">
              {c.flowPressure.toFixed(2)} · {c.burstHint}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
