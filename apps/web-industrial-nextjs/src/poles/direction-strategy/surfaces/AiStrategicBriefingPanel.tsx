"use client";

export function AiStrategicBriefingPanel({ data }: { data: unknown }) {
  const b = data as {
    policy?: string;
    title?: string;
    executiveSummary?: string;
    anomalies?: string[];
    opportunities?: string[];
    recommendedActions?: string[];
    confidence?: number;
    dataSources?: string[];
    headline?: string;
    sections?: { title: string; body: string }[];
    note?: string;
    tone?: string;
  } | null;

  if (!b) return <p className="text-xs text-slate-500">Briefing unavailable.</p>;

  if (b.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Strategic narrative disabled by <span className="font-mono text-slate-300">strategic_ai_enabled</span>.
      </div>
    );
  }

  const title = b.title ?? b.headline ?? "Strategic briefing";
  const summary = b.executiveSummary ?? b.headline ?? "";

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">AI strategic briefing</p>
        <p className="text-xs text-slate-500">{b.note ?? "MockAIProvider gateway — executive cadence, not chatbot banter."}</p>
      </header>
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {summary ? <p className="text-[13px] leading-relaxed text-slate-300">{summary}</p> : null}
      {typeof b.confidence === "number" ? (
        <p className="text-[11px] text-slate-500">
          Confidence <span className="font-mono text-cyan-200/80">{b.confidence.toFixed(3)}</span>
        </p>
      ) : null}
      {(b.anomalies?.length ?? 0) > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Anomalies</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] text-slate-400">
            {(b.anomalies ?? []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {(b.opportunities?.length ?? 0) > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Opportunities</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] text-slate-400">
            {(b.opportunities ?? []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {(b.recommendedActions?.length ?? 0) > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Recommended actions</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] text-emerald-200/80">
            {(b.recommendedActions ?? []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {(b.dataSources?.length ?? 0) > 0 ? (
        <p className="text-[10px] text-slate-600">
          Sources:{" "}
          <span className="font-mono text-slate-500">{(b.dataSources ?? []).slice(0, 8).join(" · ")}</span>
        </p>
      ) : null}
      {(b.sections ?? []).length > 0 ? (
        <div className="space-y-3 border-t border-slate-800/80 pt-3">
          {(b.sections ?? []).map((s, i) => (
            <article key={i} className="border-l-2 border-amber-500/40 pl-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{s.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{s.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
