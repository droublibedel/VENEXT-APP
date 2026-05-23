"use client";

import type { DataIntelligenceOverviewResponse } from "@venext/shared-contracts";

export function DataOverview({ data }: { data: DataIntelligenceOverviewResponse | undefined }) {
  if (!data) return <p className="text-xs text-slate-500">No overview.</p>;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Economic operating snapshot</p>
      <p className="mt-1 text-slate-400">{data.headline}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] text-cyan-200/90">
        <div>propagation</div>
        <div>{data.economicPropagationScore.toFixed(2)}</div>
        <div>correlations</div>
        <div>{data.activeCorrelations}</div>
        <div>anomalies</div>
        <div>{data.openAnomalies}</div>
        <div>predictive peak</div>
        <div>{data.predictiveHighRisk.toFixed(2)}</div>
        <div>guardian</div>
        <div>{data.dataQualityGuardianReadiness.toFixed(2)}</div>
      </dl>
    </section>
  );
}
