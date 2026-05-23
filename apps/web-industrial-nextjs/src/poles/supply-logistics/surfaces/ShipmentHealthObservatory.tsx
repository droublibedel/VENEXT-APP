"use client";

import type { ShipmentHealthResponse } from "@venext/shared-contracts";

export function ShipmentHealthObservatory({ data, compact }: { data: ShipmentHealthResponse | undefined; compact?: boolean }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Shipment health disabled by <span className="font-mono text-slate-300">shipment_health_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-teal-900/30 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-teal-200/85">Shipment health</p>
        <p className="text-[11px] text-slate-500">
          OK {data.healthyCount} · delayed {data.delayedCount} · unstable {data.unstableCount} · suspicious{" "}
          {data.suspiciousCount} · blocked {data.blockedCount}
        </p>
      </header>
      <ul className={`${compact ? "max-h-28" : "max-h-36"} space-y-1 overflow-y-auto text-[10px]`}>
        {data.rows.slice(0, compact ? 5 : 10).map((r) => (
          <li key={r.orderId} className="rounded border border-slate-800/60 px-2 py-1">
            <span className="font-mono text-slate-500">{r.orderId.slice(0, 8)}…</span>{" "}
            <span className="text-teal-200/90">{r.executionHealth}</span> · health {r.healthScore.toFixed(2)} · delay{" "}
            {r.delayProbability.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
