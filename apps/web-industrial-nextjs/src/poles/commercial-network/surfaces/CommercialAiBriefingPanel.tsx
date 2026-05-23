"use client";

export function CommercialAiBriefingPanel({ data }: { data: unknown }) {
  const b = data as {
    policy?: string;
    title?: string;
    executiveSummary?: string;
    anomalies?: string[];
    opportunities?: string[];
    recommendedActions?: string[];
    confidence?: number;
    dataSources?: string[];
    note?: string;
    tone?: string;
  } | null;

  if (!b) return <p className="text-xs text-slate-500">Commercial briefing unavailable.</p>;

  if (b.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Commercial narrative disabled by <span className="font-mono text-slate-300">commercial_network_ai_enabled</span>.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Commercial AI briefing</p>
        <p className="text-xs text-slate-500">{b.note ?? "MockAIProvider — strategist cadence, not chatbot."}</p>
      </header>
      <p className="text-sm font-semibold text-slate-100">{b.title ?? "Commercial briefing"}</p>
      {b.executiveSummary ? <p className="text-[13px] leading-relaxed text-slate-300">{b.executiveSummary}</p> : null}
      {typeof b.confidence === "number" ? (
        <p className="text-[11px] text-slate-500">
          Confidence <span className="font-mono text-cyan-200/80">{b.confidence.toFixed(3)}</span>
        </p>
      ) : null}
      {(b.anomalies?.length ?? 0) > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-[12px] text-slate-400">
          {(b.anomalies ?? []).map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : null}
      {(b.opportunities?.length ?? 0) > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-[12px] text-slate-400">
          {(b.opportunities ?? []).map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : null}
      {(b.recommendedActions?.length ?? 0) > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-[12px] text-emerald-200/80">
          {(b.recommendedActions ?? []).map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : null}
      {(b.dataSources?.length ?? 0) > 0 ? (
        <p className="text-[10px] text-slate-600 font-mono">{(b.dataSources ?? []).slice(0, 8).join(" · ")}</p>
      ) : null}
    </section>
  );
}
