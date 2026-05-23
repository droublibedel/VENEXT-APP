"use client";

import type { IntelligenceInterventionsResponse } from "@venext/shared-contracts";

export function IntelligenceInterventionQueue({ data }: { data: IntelligenceInterventionsResponse | undefined }) {
  if (!data) return null;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Intelligence interventions</p>
      <ol className="mt-2 space-y-2">
        {data.interventions.map((i) => (
          <li key={i.id} className="border-l-2 border-cyan-700/60 pl-2">
            <span className="font-mono text-[10px] text-cyan-200/90">{i.kind}</span> · {i.headline}
            {i.finalScore != null ? <span className="ml-2 text-slate-500">score {i.finalScore.toFixed(3)}</span> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
