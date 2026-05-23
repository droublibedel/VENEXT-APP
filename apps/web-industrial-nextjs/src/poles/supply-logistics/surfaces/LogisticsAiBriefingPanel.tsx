"use client";

import type { SupplyLogisticsBriefingResponse } from "@venext/shared-contracts";

export function LogisticsAiBriefingPanel({ data }: { data: SupplyLogisticsBriefingResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Logistics briefing disabled by <span className="font-mono text-slate-300">supply_ai_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-emerald-800/40 bg-slate-950/50 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-200/90">Logistics AI briefing</p>
        {data.title ? <p className="text-sm font-medium text-slate-100">{data.title}</p> : null}
      </header>
      {data.executiveSummary ? <p className="text-[11px] leading-relaxed text-slate-300">{data.executiveSummary}</p> : null}
      {data.anomalies?.length ? (
        <ul className="list-inside list-disc text-[10px] text-amber-200/85">
          {data.anomalies.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : null}
      {data.note ? <p className="text-[9px] text-slate-600">{data.note}</p> : null}
    </section>
  );
}
