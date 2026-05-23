"use client";

import type { PaymentAnomalyRadarResponse } from "@venext/shared-contracts";

export function PaymentAnomalyRadar({ data }: { data: PaymentAnomalyRadarResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Payment anomalies — disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Payment anomaly radar</h3>
      <ul className="mt-2 max-h-28 space-y-1 overflow-auto text-[10px] text-slate-300">
        {data.anomalies.slice(0, 12).map((a) => (
          <li key={a.id} className="truncate" title={a.detail}>
            {a.kind} · sev {a.severity.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
