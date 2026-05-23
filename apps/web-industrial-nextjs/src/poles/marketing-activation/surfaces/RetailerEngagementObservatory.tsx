"use client";

import type { RetailerEngagementObservatoryResponse } from "@venext/shared-contracts";

export function RetailerEngagementObservatory({ data }: { data: RetailerEngagementObservatoryResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-500">
        Retailer engagement disabled by <span className="font-mono text-violet-200/80">retailer_engagement_enabled</span>.
      </div>
    );
  }
  const s = data.segmentCounts;
  return (
    <section className="space-y-2 rounded border border-rose-900/25 bg-rose-950/10 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/90">Retailer engagement</p>
        <p className="text-[11px] text-slate-500">Downstream behavioral density — clusters, not CRM lists.</p>
      </header>
      <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
        <span className="rounded bg-slate-900/80 px-2 py-0.5">High {s.highlyEngaged}</span>
        <span className="rounded bg-slate-900/80 px-2 py-0.5">Weak {s.weaklyEngaged}</span>
        <span className="rounded bg-slate-900/80 px-2 py-0.5">Dormant {s.dormant}</span>
        <span className="rounded bg-slate-900/80 px-2 py-0.5">Sensitive {s.activationSensitive}</span>
        <span className="rounded bg-slate-900/80 px-2 py-0.5">Sponsor-reactive {s.sponsorReactive}</span>
      </div>
      <ul className="max-h-44 space-y-1 overflow-y-auto text-[11px]">
        {data.rows.slice(0, 10).map((r) => (
          <li key={r.organizationId} className="flex justify-between gap-2 rounded border border-slate-800/60 px-2 py-1">
            <span className="truncate text-slate-200">{r.displayName}</span>
            <span className="font-mono text-rose-200/90">{r.engagementScore.toFixed(2)}</span>
            <span className="text-[9px] uppercase text-slate-500">{r.cluster}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
