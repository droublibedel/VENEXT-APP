"use client";

import type { MarketingActivationBriefingResponse } from "@venext/shared-contracts";

export function MarketingAiBriefingPanel({ data }: { data: MarketingActivationBriefingResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Activation narrative disabled by <span className="font-mono text-slate-300">marketing_activation_ai_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-3 rounded border border-violet-800/40 bg-slate-950/50 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-200/80">Marketing AI briefing</p>
        <p className="text-xs text-slate-500">{data.note ?? "MockAIProvider — activation operator cadence."}</p>
      </header>
      <p className="text-sm font-semibold text-slate-100">{data.title}</p>
      {data.executiveSummary ? <p className="text-xs text-slate-400">{data.executiveSummary}</p> : null}
      {data.anomalies?.length ? (
        <ul className="list-inside list-disc text-[11px] text-amber-100/90">
          {data.anomalies.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : null}
      {data.opportunities?.length ? (
        <ul className="list-inside list-decimal text-[11px] text-emerald-100/85">
          {data.opportunities.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      ) : null}
      {data.recommendedActions?.length ? (
        <ol className="list-inside list-decimal text-[11px] text-slate-300">
          {data.recommendedActions.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ol>
      ) : null}
      {typeof data.confidence === "number" ? (
        <p className="font-mono text-[10px] text-slate-500">confidence {data.confidence.toFixed(3)}</p>
      ) : null}
    </section>
  );
}
