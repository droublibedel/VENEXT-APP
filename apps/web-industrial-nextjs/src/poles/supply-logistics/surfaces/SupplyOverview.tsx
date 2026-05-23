"use client";

import type { SupplyOverviewResponse } from "@venext/shared-contracts";

export function SupplyOverview({ data }: { data: SupplyOverviewResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Supply / logistics disabled by <span className="font-mono text-emerald-200/80">supply_logistics_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-3 rounded border border-emerald-900/35 bg-slate-950/40 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-200/90">Supply overview</p>
        <p className="text-[11px] text-slate-500">Movement field — not a shipment table.</p>
      </header>
      <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
        <Metric label="Active" v={data.activeShipments} />
        <Metric label="Delayed" v={data.delayedShipments} accent="amber" />
        <Metric label="Unstable terr." v={data.unstableTerritories} accent="rose" />
        <Metric label="Corridor" v={data.routeCongestionIndex.toFixed(2)} suffix="idx" />
        <Metric label="Hub pressure" v={data.warehousePressureIndex.toFixed(2)} suffix="idx" />
        <Metric label="Loading dwell" v={data.loadingDelayIndex.toFixed(2)} suffix="idx" />
        <Metric label="Fulfillment conf." v={data.fulfillmentConfidence.toFixed(2)} />
        <Metric label="Downstream quality" v={data.downstreamSupplyQuality.toFixed(2)} />
        <Metric label="Route exec." v={data.routeExecutionConfidence.toFixed(2)} />
      </div>
      <ul className="space-y-1.5 border-t border-slate-800/80 pt-2">
        {data.movementStrips.map((s) => (
          <li key={s.id} className="flex flex-col gap-0.5 rounded bg-slate-900/40 px-2 py-1.5">
            <span className="text-[9px] font-mono uppercase text-emerald-200/70">{s.band} · {s.vector}</span>
            <span className="text-[11px] text-slate-200">{s.label}</span>
            <span className="font-mono text-[10px] text-emerald-300/90">tension {s.tension.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] text-slate-600">
        Edge: {data.edgeReadiness.routeTelemetry.status} — {data.edgeReadiness.routeTelemetry.note.slice(0, 120)}…
      </p>
    </section>
  );
}

function Metric({ label, v, suffix, accent }: { label: string; v: string | number; suffix?: string; accent?: "amber" | "rose" }) {
  const c = accent === "amber" ? "text-amber-200/90" : accent === "rose" ? "text-rose-200/90" : "text-emerald-200/90";
  return (
    <div className="rounded border border-slate-800/60 px-2 py-1">
      <p className="text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-mono text-sm ${c}`}>
        {v}
        {suffix ? <span className="text-[9px] text-slate-500"> {suffix}</span> : null}
      </p>
    </div>
  );
}
