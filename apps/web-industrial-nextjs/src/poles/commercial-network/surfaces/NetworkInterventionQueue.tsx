"use client";

export function NetworkInterventionQueue({ data }: { data: unknown }) {
  const q = data as {
    interventions?: { id: string; kind: string; urgency: string; expectedImpact: string; confidence: number }[];
  } | null;

  if (!q?.interventions?.length) return <p className="text-xs text-slate-500">No interventions synthesized.</p>;

  return (
    <section className="space-y-2">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Network intervention queue</p>
        <p className="text-xs text-slate-500">Actionable field-commerce moves — urgency × impact.</p>
      </header>
      <ul className="max-h-[240px] space-y-2 overflow-y-auto text-[11px]">
        {q.interventions.map((it) => (
          <li key={it.id} className="rounded border border-slate-800/80 bg-slate-950/70 px-2 py-1.5">
            <p className="font-mono text-[10px] text-amber-200/80">{it.urgency}</p>
            <p className="text-slate-200">{it.kind.replace(/_/g, " ")}</p>
            <p className="text-slate-500">{it.expectedImpact}</p>
            <p className="text-[10px] text-slate-600">conf {it.confidence.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
