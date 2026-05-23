"use client";

import type { OrderRiskMatrixResponse } from "@venext/shared-contracts";

export function OrderRiskMatrix({ data }: { data: OrderRiskMatrixResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-rose-900/40 bg-slate-950/40 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/90">Order risk matrix</p>
        <p className="text-[11px] text-slate-500">Transaction risk engine — severity-classified supervision.</p>
      </header>
      <ul className="space-y-2 text-[11px]">
        {data.rows.map((r) => (
          <li key={r.id} className="rounded border border-slate-800/70 bg-slate-900/50 px-2 py-2">
            <p className="font-mono text-[10px] text-rose-200/90">
              {r.severity} · conf {r.confidence.toFixed(2)}
            </p>
            <p className="text-slate-200">{r.probableCause}</p>
            <p className="text-slate-500">{r.recommendation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
