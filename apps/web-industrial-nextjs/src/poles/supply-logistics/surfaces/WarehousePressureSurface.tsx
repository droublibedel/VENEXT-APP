"use client";

import type { WarehousePressureResponse } from "@venext/shared-contracts";

export function WarehousePressureSurface({ data, compact }: { data: WarehousePressureResponse | undefined; compact?: boolean }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Warehouse pressure disabled by <span className="font-mono text-slate-300">warehouse_pressure_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-amber-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/85">Hub / warehouse pressure</p>
        <p className="text-[10px] text-rose-200/80">Hot hubs: {data.overloadedHubs.join(" · ") || "—"}</p>
      </header>
      <ul className={`${compact ? "max-h-24" : "max-h-32"} space-y-1 overflow-y-auto text-[11px]`}>
        {data.rows.slice(0, compact ? 4 : 8).map((r) => (
          <li key={r.hubKey} className="flex justify-between gap-2 border-b border-slate-800/50 py-1">
            <span className="text-slate-300">{r.label}</span>
            <span className="font-mono text-amber-200/90">{r.saturation.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
