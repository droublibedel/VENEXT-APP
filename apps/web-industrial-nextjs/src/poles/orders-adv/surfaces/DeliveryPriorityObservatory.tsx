"use client";

import type { DeliveryPriorityResponse } from "@venext/shared-contracts";

export function DeliveryPriorityObservatory({
  data,
  compact,
}: {
  data: DeliveryPriorityResponse | undefined;
  compact?: boolean;
}) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-cyan-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/85">Delivery priority</p>
        <p className="text-[11px] text-slate-500">
          Urgent {data.urgentDeliveries} · blocked {data.blockedDeliveries} · instability {data.fulfillmentInstability.toFixed(2)}
        </p>
      </header>
      <ul className={`${compact ? "max-h-24" : "max-h-36"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.rows.slice(0, compact ? 5 : 10).map((r) => (
          <li key={r.orderId} className="flex justify-between gap-2 border-b border-slate-800/60 py-1">
            <span className="text-slate-400">{r.orderId.slice(0, 8)}…</span>
            <span className="font-mono text-cyan-200/90">{r.priorityScore.toFixed(2)}</span>
            <span className="text-[9px] uppercase text-slate-500">{r.blocked ? "blocked" : r.congestionHint}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
