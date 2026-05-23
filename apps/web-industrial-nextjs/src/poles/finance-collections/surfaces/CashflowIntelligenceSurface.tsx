"use client";

import type { CashflowIntelligenceResponse } from "@venext/shared-contracts";

export function CashflowIntelligenceSurface({ data }: { data: CashflowIntelligenceResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Cashflow intelligence — disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Cashflow intelligence</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
        <Metric label="Inflow stability" v={data.inflowStability.toFixed(2)} />
        <Metric label="Delayed inflow" v={data.delayedInflowSignal.toFixed(2)} />
        <Metric label="Collection acceleration" v={data.collectionAcceleration.toFixed(2)} />
        <Metric label="Unstable cycles" v={data.unstableCycleScore.toFixed(2)} />
        <Metric label="Treasury pressure" v={data.treasuryPressure.toFixed(2)} />
        <Metric label="Rhythm degradation" v={data.settlementRhythmDegradation.toFixed(2)} />
      </div>
    </section>
  );
}

function Metric({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded border border-slate-800/80 bg-slate-900/40 px-2 py-1">
      <p className="text-[9px] uppercase text-slate-500">{label}</p>
      <p className="font-mono text-slate-100">{v}</p>
    </div>
  );
}
