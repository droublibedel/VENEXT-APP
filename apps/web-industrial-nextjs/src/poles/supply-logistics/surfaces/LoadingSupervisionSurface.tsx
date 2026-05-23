"use client";

import type { LoadingSupervisionResponse } from "@venext/shared-contracts";

export function LoadingSupervisionSurface({ data, compact }: { data: LoadingSupervisionResponse | undefined; compact?: boolean }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-orange-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-orange-200/85">Loading / unloading</p>
        <p className="text-[11px] text-slate-500">
          Loading delays {data.loadingDelayCount} · unloading stress {data.unloadingInstabilityCount} · queue{" "}
          {data.queueCongestionScore.toFixed(2)}
        </p>
      </header>
      <ul className={`${compact ? "max-h-24" : "max-h-32"} space-y-1 overflow-y-auto text-[10px]`}>
        {data.rows.slice(0, compact ? 4 : 8).map((r) => (
          <li key={`${r.orderId}-${r.kind}`} className="rounded border border-slate-800/50 px-2 py-1">
            <span className="text-orange-200/80">{r.kind}</span> · {r.label.slice(0, 48)}… · wait {r.waitPressure.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
