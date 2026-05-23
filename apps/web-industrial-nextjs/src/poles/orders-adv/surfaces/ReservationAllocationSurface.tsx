"use client";

import type { ReservationAllocationResponse } from "@venext/shared-contracts";

export function ReservationAllocationSurface({ data }: { data: ReservationAllocationResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Reservation / allocation disabled by <span className="font-mono text-slate-300">reservation_allocation_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-violet-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-200/85">Reservation / allocation</p>
        <p className="text-[11px] text-slate-500">Draft-line soft reservations vs economic tension.</p>
      </header>
      <ul className="max-h-36 space-y-1 overflow-y-auto text-[11px]">
        {data.rows.slice(0, 10).map((r) => (
          <li key={r.productId} className="flex justify-between gap-2 border-b border-slate-800/60 py-1">
            <span className="text-slate-300">{r.productName}</span>
            <span className="font-mono text-violet-200/90">{r.allocationConflictScore.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
