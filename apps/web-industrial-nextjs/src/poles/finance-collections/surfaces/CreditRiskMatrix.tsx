"use client";

import type { CreditRiskMatrixResponse } from "@venext/shared-contracts";

export function CreditRiskMatrix({ data }: { data: CreditRiskMatrixResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Credit risk — disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Credit risk matrix</h3>
      <p className="mt-1 text-[10px] text-slate-500">
        Solvency {data.downstreamSolvencyRisk.toFixed(2)} · concentration {data.exposureConcentration.toFixed(2)} · collapse field{" "}
        {data.collapseRiskField.toFixed(2)}
      </p>
      <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-[10px] text-slate-300">
        {data.rows.slice(0, 10).map((r) => (
          <li key={r.id} className="truncate" title={r.recommendation}>
            {r.affectedDisplayName} · {r.severity} · {r.exposureAmount.toFixed(0)} {r.currency}
          </li>
        ))}
      </ul>
    </section>
  );
}
