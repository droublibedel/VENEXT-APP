"use client";

import type { DeliveryRouteIntelligenceResponse } from "@venext/shared-contracts";

export function DeliveryRouteIntelligence({ data, compact }: { data: DeliveryRouteIntelligenceResponse | undefined; compact?: boolean }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-indigo-900/30 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-200/85">Route intelligence</p>
        <p className="text-[10px] text-slate-500">{data.telemetryNote}</p>
        <p className="text-[10px] text-amber-200/80">Clusters: {data.congestionClusters}</p>
      </header>
      <ul className={`${compact ? "max-h-24" : "max-h-32"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.rows.slice(0, compact ? 5 : 9).map((r) => (
          <li key={r.corridorKey} className="flex justify-between gap-2 border-b border-slate-800/50 py-1">
            <span className="truncate text-slate-300">{r.label}</span>
            <span className="shrink-0 font-mono text-indigo-200/90">{r.instability.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
