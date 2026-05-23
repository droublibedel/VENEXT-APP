"use client";

import type { OrderAdvInterventionsResponse } from "@venext/shared-contracts";

export function TransactionInterventionQueue({ data }: { data: OrderAdvInterventionsResponse | undefined }) {
  if (!data) return null;
  return (
    <section className="space-y-2 rounded border border-rose-900/35 bg-slate-950/40 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/90">Transaction interventions</p>
        <p className="text-[11px] text-slate-500">Ranked execution queue — finalScore descending.</p>
      </header>
      <ul className="max-h-52 space-y-1 overflow-y-auto text-[11px]">
        {data.interventions.map((i) => (
          <li key={i.id} className="rounded border border-slate-800/60 px-2 py-1.5">
            <p className="font-mono text-[10px] text-amber-200/90">
              {i.urgency} · score {i.finalScore?.toFixed(3) ?? "—"}
            </p>
            <p className="text-slate-200">{i.expectedImpact}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
