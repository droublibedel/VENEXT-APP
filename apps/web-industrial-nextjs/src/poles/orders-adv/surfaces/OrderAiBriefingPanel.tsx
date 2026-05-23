"use client";

import type { OrderAdvBriefingResponse } from "@venext/shared-contracts";

export function OrderAiBriefingPanel({ data }: { data: OrderAdvBriefingResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Execution briefing disabled by <span className="font-mono text-slate-300">order_adv_ai_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-3 rounded border border-rose-800/40 bg-slate-950/50 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/80">Order / ADV briefing</p>
        <p className="text-xs text-slate-500">{data.note ?? "MockAIProvider — execution strategist cadence."}</p>
      </header>
      {data.title ? <p className="text-sm font-semibold text-slate-100">{data.title}</p> : null}
      {data.executiveSummary ? <p className="text-sm text-slate-200">{data.executiveSummary}</p> : null}
      {data.anomalies?.length ? (
        <ul className="list-inside list-disc text-[11px] text-amber-100/90">
          {data.anomalies.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
