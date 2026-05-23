"use client";

import type { SupplyInterventionsResponse } from "@venext/shared-contracts";

export function SupplyInterventionQueue({ data }: { data: SupplyInterventionsResponse | undefined }) {
  if (!data) return null;
  return (
    <section className="space-y-2 rounded border border-lime-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-lime-200/85">Intervention queue</p>
      </header>
      <ul className="max-h-48 space-y-2 overflow-y-auto text-[11px]">
        {data.interventions.map((i) => (
          <li key={i.id} className="rounded border border-slate-800/60 px-2 py-2">
            <div className="flex justify-between gap-2">
              <span className="font-mono text-[10px] text-lime-200/80">{i.kind}</span>
              <span className="text-[10px] text-slate-500">{i.urgency}</span>
            </div>
            <p className="text-slate-300">{i.expectedImpact}</p>
            <p className="font-mono text-[9px] text-slate-600">
              score {i.finalScore?.toFixed(3) ?? "—"} · {i.affectedTerritories.slice(0, 3).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
