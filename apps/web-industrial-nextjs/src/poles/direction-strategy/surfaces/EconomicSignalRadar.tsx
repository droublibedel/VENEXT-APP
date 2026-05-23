"use client";

export function EconomicSignalRadar({ data }: { data: unknown }) {
  const r = data as {
    internal?: { id: string; impact: string; signalType: string; whyItMatters: string }[];
    external?: { kind?: string; label: string; impact: string; whyItMatters: string }[];
    correlation?: { thesis: string; jointSeverity: string }[];
  } | null;

  if (!r?.internal && !r?.external) {
    return <p className="text-xs text-slate-500">Signal radar offline.</p>;
  }

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Economic signal radar</p>
        <p className="text-xs text-slate-500">Internal telemetry correlated with declared external context.</p>
      </header>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[10px] uppercase text-slate-500">Internal fabric</p>
          <ul className="max-h-56 space-y-1 overflow-y-auto text-[11px] text-slate-300">
            {(r.internal ?? []).slice(0, 14).map((s) => (
              <li key={s.id} className="rounded border border-slate-800/80 bg-slate-950/60 px-2 py-1">
                <span className="font-mono text-cyan-200/90">{s.signalType}</span> ·{" "}
                <span className="text-amber-200/80">{s.impact}</span>
                <span className="mt-0.5 block text-slate-500">{s.whyItMatters}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase text-slate-500">External overlays (labeled)</p>
          <ul className="space-y-1 text-[11px] text-slate-300">
            {(r.external ?? []).map((e, i) => (
              <li key={`${e.kind ?? "ext"}-${i}`} className="rounded border border-emerald-900/40 bg-emerald-950/20 px-2 py-1">
                <span className="text-emerald-200/90">{e.kind ?? "EXTERNAL"}</span> · {e.label}{" "}
                <span className="text-amber-200/80">({e.impact})</span>
                <span className="mt-0.5 block text-slate-500">{e.whyItMatters}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded border border-slate-800/90 bg-slate-950/70 px-3 py-2">
        <p className="text-[10px] uppercase text-slate-500">Correlation thesis</p>
        <ul className="mt-1 space-y-1 text-[11px] text-slate-400">
          {(r.correlation ?? []).slice(0, 6).map((c, i) => (
            <li key={i}>
              <span className="font-mono text-slate-500">{c.jointSeverity}</span> — {c.thesis}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
