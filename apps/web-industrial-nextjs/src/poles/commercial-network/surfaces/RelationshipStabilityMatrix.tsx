"use client";

export function RelationshipStabilityMatrix({ data }: { data: unknown }) {
  const s = data as {
    policy?: string;
    rows?: { id: string; severity: string; probableCause: string; recommendation: string; confidence: number }[];
  } | null;

  if (s?.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Stability matrix disabled by <span className="font-mono text-slate-300">relationship_stability_enabled</span>.
      </div>
    );
  }

  if (!s?.rows?.length) return <p className="text-xs text-slate-500">No stability risks in current window.</p>;

  return (
    <section className="space-y-2">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Relationship stability matrix</p>
        <p className="text-xs text-slate-500">Severity-ranked supervision — not ticketing chrome.</p>
      </header>
      <ul className="max-h-[220px] space-y-2 overflow-y-auto text-[11px]">
        {s.rows.slice(0, 12).map((row) => (
          <li key={row.id} className="rounded border border-slate-800/80 bg-slate-950/60 px-2 py-1.5 text-slate-300">
            <p className="font-mono text-[10px] text-rose-200/80">{row.severity}</p>
            <p>{row.probableCause}</p>
            <p className="text-emerald-200/80">{row.recommendation}</p>
            <p className="text-[10px] text-slate-600">confidence {row.confidence.toFixed(3)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
