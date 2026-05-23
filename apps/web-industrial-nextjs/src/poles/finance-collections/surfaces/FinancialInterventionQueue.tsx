"use client";

import type { FinancialInterventionsResponse } from "@venext/shared-contracts";

export function FinancialInterventionQueue({ data }: { data: FinancialInterventionsResponse | undefined }) {
  if (!data?.interventions?.length) {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Interventions — none or disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Financial intervention queue</h3>
      <ul className="mt-2 max-h-40 space-y-1.5 overflow-auto text-[10px] text-slate-300">
        {data.interventions.map((i) => (
          <li key={i.id} className="rounded border border-slate-800/80 bg-slate-900/40 px-2 py-1">
            <span className="font-mono text-rose-200/80">{i.kind}</span> · score {i.finalScore.toFixed(2)} · {i.headline}
          </li>
        ))}
      </ul>
    </section>
  );
}
