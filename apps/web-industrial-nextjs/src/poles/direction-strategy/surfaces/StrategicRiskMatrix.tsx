"use client";

export function StrategicRiskMatrix({ data }: { data: unknown }) {
  const r = data as {
    risks?: {
      riskType: string;
      severity: string;
      affectedEntities: string[];
      estimatedImpact: string;
      recommendedAction: string;
    }[];
  } | null;

  if (!r?.risks?.length) {
    return <p className="text-xs text-slate-500">Risk matrix sparse — insufficient graph motion for archetypes.</p>;
  }

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Strategic risk matrix</p>
        <p className="text-xs text-slate-500">Dependency, diversification, and territory instability — not compliance theater.</p>
      </header>
      <ul className="space-y-2">
        {r.risks.map((x, i) => (
          <li key={i} className="rounded border border-slate-800/90 bg-slate-950/70 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-amber-200/90">{x.riskType}</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase text-slate-300">{x.severity}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">{x.estimatedImpact}</p>
            <p className="mt-1 text-[11px] text-emerald-200/70">{x.recommendedAction}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
