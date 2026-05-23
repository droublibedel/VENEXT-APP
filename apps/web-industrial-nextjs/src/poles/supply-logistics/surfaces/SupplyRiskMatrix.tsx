"use client";

import type { SupplyRiskMatrixResponse } from "@venext/shared-contracts";

export function SupplyRiskMatrix({ data }: { data: SupplyRiskMatrixResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-red-900/30 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-red-200/85">Supply risk matrix</p>
      </header>
      <ul className="max-h-40 space-y-2 overflow-y-auto text-[11px]">
        {data.rows.map((r) => (
          <li key={r.id} className="rounded border border-slate-800/60 bg-slate-900/30 px-2 py-2">
            <p className="text-[10px] uppercase text-red-200/80">{r.severity}</p>
            <p className="text-slate-200">{r.probableCause}</p>
            <p className="text-[10px] text-slate-500">{r.recommendation}</p>
            <p className="font-mono text-[9px] text-slate-600">conf {r.confidence.toFixed(2)} · {r.affectedTerritories.join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
