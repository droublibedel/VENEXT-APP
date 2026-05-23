"use client";

import type { OrdersOverviewResponse } from "@venext/shared-contracts";

export function OrdersOverview({ data }: { data: OrdersOverviewResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Orders overview disabled by <span className="font-mono text-rose-200/90">order_adv_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-3 rounded border border-rose-900/35 bg-rose-950/15 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/90">Orders overview</p>
        <p className="text-xs text-slate-500">Transaction pressure — not ERP line items.</p>
      </header>
      <div className="grid gap-2 sm:grid-cols-3">
        {(
          [
            ["Active orders", data.activeOrders],
            ["Delayed orders", data.delayedOrders],
            ["Negotiation intensity", data.negotiationIntensity],
            ["Grouped buying", data.groupedBuyingActivity],
            ["Reservation pressure", data.reservationPressure],
            ["Delivery tension", data.deliveryTension],
            ["Retailer demand Δ", data.retailerDemandAcceleration],
            ["Transaction confidence", data.transactionConfidence],
            ["Conversational commerce", data.conversationalCommerceIntensity],
          ] as const
        ).map(([label, v]) => (
          <div key={label} className="rounded border border-slate-800/80 bg-slate-950/60 px-2 py-2">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
            <p className="font-mono text-sm text-slate-100">{typeof v === "number" ? v.toFixed(2) : String(v)}</p>
            <div className="mt-1 h-1 overflow-hidden rounded bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-rose-700 to-amber-600"
                style={{ width: `${Math.min(100, typeof v === "number" ? v * 100 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <ul className="space-y-1 border-t border-slate-800/80 pt-2">
        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Demand vectors</p>
        {data.signalStrips.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded bg-slate-900/70 px-2 py-1.5 text-[11px]">
            <span className="font-mono text-[9px] text-amber-200/90">{s.vector}</span>
            <span className="text-slate-300">{s.label}</span>
            <span className="ml-auto font-mono text-rose-200/90">{s.tension.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
