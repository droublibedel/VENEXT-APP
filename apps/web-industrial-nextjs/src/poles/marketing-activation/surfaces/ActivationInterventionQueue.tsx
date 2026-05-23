"use client";

import type { ActivationInterventionsResponse } from "@venext/shared-contracts";

export function ActivationInterventionQueue({ data }: { data: ActivationInterventionsResponse | undefined }) {
  if (!data?.interventions?.length) return null;
  return (
    <section className="space-y-2 rounded border border-slate-800 bg-slate-950/40 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-300">Activation intervention queue</p>
        <p className="text-[11px] text-slate-500">Tactical queue — sponsorship, dormant zones, momentum decay.</p>
      </header>
      <ul className="space-y-2 text-[11px]">
        {data.interventions.map((i) => (
          <li key={i.id} className="rounded border border-slate-800/80 bg-slate-900/60 px-2 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-violet-200/90">{i.kind}</span>
              <span className="text-[9px] uppercase text-amber-200/80">{i.urgency}</span>
            </div>
            <p className="text-slate-200">{i.expectedImpact}</p>
            <p className="text-[10px] text-slate-500">
              confidence {i.confidence.toFixed(2)}
              {i.affectedTerritories.length ? ` · ${i.affectedTerritories.join(", ")}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
