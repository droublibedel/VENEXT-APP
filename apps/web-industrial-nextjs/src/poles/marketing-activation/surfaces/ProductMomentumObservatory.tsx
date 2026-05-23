"use client";

import type { ProductMomentumObservatoryResponse } from "@venext/shared-contracts";

export function ProductMomentumObservatory({ data }: { data: ProductMomentumObservatoryResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-500">
        Product momentum disabled by <span className="font-mono text-violet-200/80">product_momentum_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-cyan-900/25 bg-cyan-950/10 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/90">Product momentum</p>
        <p className="text-[11px] text-slate-500">Order growth · negotiation velocity · sponsorship-assisted lift.</p>
      </header>
      <ul className="max-h-52 space-y-1 overflow-y-auto text-[11px]">
        {data.rows.slice(0, 14).map((r) => (
          <li key={r.productId} className="rounded border border-slate-800/60 px-2 py-1">
            <div className="flex justify-between gap-2">
              <span className="text-slate-100">{r.name}</span>
              <span className="font-mono text-cyan-200/90">{r.momentumScore.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {r.state} · neg {r.negotiationVelocity} · sponsor {r.sponsorshipAssisted ? "yes" : "no"} · penetration{" "}
              {r.territoryPenetration.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
