"use client";

import type { PaymentPressureRadarResponse } from "@venext/shared-contracts";

export function PaymentPressureRadar({ data }: { data: PaymentPressureRadarResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Payment pressure — disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Payment pressure radar</h3>
      <p className="mt-1 text-[11px] text-slate-400">
        Collapse risk {data.collectionCollapseRisk.toFixed(2)} · concentration {data.paymentConcentrationIndex.toFixed(2)} · liquidity
        tension {data.liquidityTensionIndex.toFixed(2)}
      </p>
      <ul className="mt-2 max-h-28 space-y-1 overflow-auto text-[10px] text-slate-300">
        {data.overdueTerritories.map((t) => (
          <li key={t.territoryCode} className="font-mono">
            {t.territoryCode} · overdue {t.overdueMass.toFixed(2)} · buyers {t.unstableBuyerCount}
          </li>
        ))}
      </ul>
    </section>
  );
}
