"use client";

import type { RelationalEconomicGraphOverviewDto } from "@venext/shared-contracts";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function GraphOverviewSurface(props: { overview: RelationalEconomicGraphOverviewDto | null }) {
  const o = props.overview;
  if (!o) return <VenextInlineSkeleton variant="table" className="p-1" />;
  return (
    <div className="grid grid-cols-2 gap-2 text-[9px] sm:grid-cols-3" data-testid="economic-graph-overview">
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Nœuds</p>
        <p className="font-mono text-slate-200">{o.nodeCount}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Arêtes</p>
        <p className="font-mono text-slate-200">{o.edgeCount}</p>
      </div>
      <div className="rounded border border-amber-950/50 px-2 py-1">
        <p className="text-slate-500">Exposition syst.</p>
        <p className="font-mono text-amber-100">{o.systemicExposureScore}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Dépendance moy.</p>
        <p className="font-mono text-slate-300">{Math.round(o.averageDependencyScore)}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Propagation max</p>
        <p className="font-mono text-amber-200/90">{o.maxPropagationRisk}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Clusters</p>
        <p className="font-mono text-slate-300">{o.clusterCount}</p>
      </div>
    </div>
  );
}
