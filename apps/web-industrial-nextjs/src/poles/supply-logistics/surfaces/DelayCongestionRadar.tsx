"use client";

import type { DelayCongestionRadarResponse } from "@venext/shared-contracts";

export function DelayCongestionRadar({ data, compact }: { data: DelayCongestionRadarResponse | undefined; compact?: boolean }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-rose-900/30 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/85">Delay & congestion radar</p>
        <p className="font-mono text-[10px] text-slate-400">
          recurring {data.recurringDelayScore.toFixed(2)} · escalate {data.congestionEscalation.toFixed(2)} · collapse{" "}
          {data.territoryCollapseRisk.toFixed(2)}
        </p>
      </header>
      <ul className={`${compact ? "max-h-20" : "max-h-28"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.hotspots.slice(0, compact ? 4 : 8).map((h) => (
          <li key={h.key} className="flex justify-between border-b border-slate-800/50 py-1">
            <span className="text-slate-300">{h.label}</span>
            <span className="font-mono text-rose-200/90">{h.intensity.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
