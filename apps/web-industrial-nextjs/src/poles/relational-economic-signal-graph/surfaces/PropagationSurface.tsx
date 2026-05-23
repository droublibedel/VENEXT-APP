"use client";

import type { RelationalEconomicPropagationDto } from "@venext/shared-contracts";

export function PropagationSurface(props: { propagation: RelationalEconomicPropagationDto | null }) {
  const p = props.propagation;
  if (!p) return <p className="text-[9px] text-slate-500">Propagation non calculée.</p>;
  return (
    <div className="space-y-2 text-[9px]" data-testid="economic-propagation">
      <div className="flex flex-wrap gap-2">
        <span className="rounded border border-amber-900/40 px-2 py-0.5 font-mono text-amber-200/90">{p.propagationRisk}</span>
        <span className="text-slate-500">Profondeur cascade: {p.cascadeDepth}</span>
        <span className="text-slate-500">Exposition: {p.exposureScore}</span>
        <span className="text-slate-500">Effondrement: {Math.round(p.collapseProbability * 100)}%</span>
      </div>
      {p.affectedNodeIds.length > 0 ? (
        <p className="font-mono text-[8px] text-slate-500">Nœuds affectés: {p.affectedNodeIds.length}</p>
      ) : null}
    </div>
  );
}
