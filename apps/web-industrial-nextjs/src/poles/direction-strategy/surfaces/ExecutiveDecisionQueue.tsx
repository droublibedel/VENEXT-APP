"use client";

export function ExecutiveDecisionQueue({ data }: { data: unknown }) {
  const q = data as {
    actions?: {
      id: string;
      type: string;
      urgency: string;
      reason: string;
      impactEstimate: string;
      confidence: number;
      relatedSignals: string[];
    }[];
  } | null;

  if (!q?.actions?.length) {
    return <p className="text-xs text-slate-500">Executive queue empty.</p>;
  }

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Executive decision queue</p>
        <p className="text-xs text-slate-500">Actionable governance items derived from correlated telemetry.</p>
      </header>
      <ul className="space-y-2">
        {q.actions.map((a) => (
          <li key={a.id} className="rounded border border-slate-800/90 bg-slate-950/80 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded bg-rose-900/40 px-1.5 py-0.5 font-mono text-[10px] text-rose-100">{a.urgency}</span>
              <span className="font-mono text-cyan-200/80">{a.type}</span>
              <span className="text-slate-500">conf {a.confidence.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-[12px] text-slate-200">{a.reason}</p>
            <p className="mt-1 text-[11px] text-slate-500">{a.impactEstimate}</p>
            <p className="mt-1 text-[10px] text-slate-600">{a.relatedSignals.join(" · ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
