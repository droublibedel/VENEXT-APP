"use client";

import type { GraphIntelligenceResponse } from "@venext/shared-contracts";

export function GraphIntelligenceSurface({ data }: { data: GraphIntelligenceResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Graph intelligence</p>
      <p className="mt-1 text-slate-400">{data.narrative}</p>
      <dl className="mt-2 grid grid-cols-2 gap-1 font-mono text-[11px] text-slate-400">
        <dt>network stress</dt>
        <dd className="text-cyan-200/90">{data.networkStress.toFixed(2)}</dd>
        <dt>cluster health</dt>
        <dd>{data.clusterHealth.toFixed(2)}</dd>
        <dt>orphan edges</dt>
        <dd>{data.orphanEdges}</dd>
        <dt>trust compression</dt>
        <dd>{data.trustCompression.toFixed(2)}</dd>
      </dl>
    </section>
  );
}
