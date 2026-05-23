"use client";

import type { ReceivablesHealthResponse } from "@venext/shared-contracts";

export function ReceivablesHealthSurface({ data }: { data: ReceivablesHealthResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Receivables health — disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Receivables health</h3>
      <p className="mt-1 text-[10px] text-slate-500">
        H {data.healthyCount} · D {data.delayedCount} · U {data.unstableCount} · B {data.blockedCount} · S {data.suspiciousCount}
      </p>
      <ul className="mt-2 max-h-36 space-y-1 overflow-auto text-[10px] text-slate-300">
        {data.rows.slice(0, 12).map((r) => (
          <li key={r.id} className="truncate font-mono" title={r.recommendation}>
            {r.buyerDisplayName} · {r.healthStatus} · {r.outstandingAmount.toFixed(0)} {r.currency} · {r.delayDays}d
          </li>
        ))}
      </ul>
    </section>
  );
}
