"use client";

import type { CrossPoleCorrelationResponse } from "@venext/shared-contracts";

export function CrossPoleCorrelationSurface({ data }: { data: CrossPoleCorrelationResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Cross-pole correlations</p>
      <p className="mt-1 text-slate-400">{data.summary}</p>
      <ul className="mt-2 space-y-1 text-[11px]">
        {data.rows.slice(0, 6).map((r) => (
          <li key={r.id} className="text-slate-400">
            <span className="text-cyan-200/90">{r.poles.join(" ↔ ")}</span> — {r.evidence.slice(0, 120)}…
          </li>
        ))}
      </ul>
    </section>
  );
}
