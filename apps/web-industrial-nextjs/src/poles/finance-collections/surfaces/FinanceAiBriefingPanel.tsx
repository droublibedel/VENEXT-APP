"use client";

import type { FinanceCollectionsBriefingResponse } from "@venext/shared-contracts";

export function FinanceAiBriefingPanel({ data }: { data: FinanceCollectionsBriefingResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Finance AI briefing</h3>
        <p className="mt-2 text-[11px] text-slate-500">{data?.note ?? "Loading…"}</p>
      </section>
    );
  }
  return (
    <section className="rounded border border-amber-900/30 bg-amber-950/10 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/90">Finance AI briefing</h3>
      <p className="mt-1 text-[10px] text-slate-500">
        {data.provider} · confidence {data.confidence.toFixed(2)}
      </p>
      <p className="mt-2 text-[11px] text-slate-200">{data.executiveSummary}</p>
      <p className="mt-2 text-[10px] text-slate-400">{data.liquidityNote}</p>
      <p className="mt-1 text-[10px] text-slate-400">{data.receivablesNote}</p>
      <ul className="mt-2 list-inside list-disc text-[10px] text-slate-300">
        {data.recommendedCollectionMoves.slice(0, 5).map((m, idx) => (
          <li key={idx}>{m}</li>
        ))}
      </ul>
    </section>
  );
}
