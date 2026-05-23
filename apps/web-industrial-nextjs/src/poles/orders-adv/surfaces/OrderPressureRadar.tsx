"use client";

import type { OrderPressureResponse } from "@venext/shared-contracts";

export function OrderPressureRadar({ data, compact }: { data: OrderPressureResponse | undefined; compact?: boolean }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-rose-900/30 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/90">Order pressure radar</p>
        <p className="text-[11px] text-slate-500">
          Retailer {data.retailerPressure.toFixed(2)} · distributor load {data.distributorOverload.toFixed(2)} · fulfillment{" "}
          {data.fulfillmentAnomalyScore.toFixed(2)}
        </p>
      </header>
      <p className="text-[10px] text-amber-200/85">
        Surge territories: {data.surgeTerritories.slice(0, compact ? 3 : 5).join(" · ") || "—"}
      </p>
      <ul className={`${compact ? "max-h-24" : "max-h-36"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.cells.slice(0, compact ? 6 : 12).map((c) => (
          <li key={c.territoryKey} className="flex justify-between gap-2 border-b border-slate-800/60 py-1">
            <span className="text-slate-300">{c.label}</span>
            <span className="font-mono text-rose-200/90">{c.pressure.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
