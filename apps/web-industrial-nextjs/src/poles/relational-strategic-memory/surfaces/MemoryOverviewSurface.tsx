"use client";

import type { RelationalStrategicMemoryOverviewDto } from "@venext/shared-contracts";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function MemoryOverviewSurface(props: { overview: RelationalStrategicMemoryOverviewDto | null }) {
  const o = props.overview;
  if (!o) return <VenextInlineSkeleton variant="table" className="p-1" />;
  return (
    <div className="grid grid-cols-2 gap-2 text-[9px] sm:grid-cols-3" data-testid="memory-overview">
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Actives</p>
        <p className="font-mono text-slate-200">{o.activeCount}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Confiance moy.</p>
        <p className="font-mono text-cyan-200/80">{Math.round(o.averageConfidence)}</p>
      </div>
      <div className="rounded border border-rose-950/50 px-2 py-1">
        <p className="text-slate-500">Critiques</p>
        <p className="font-mono text-rose-100">{o.criticalActiveCount}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Archivées</p>
        <p className="font-mono text-slate-400">{o.archivedCount}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1 col-span-2">
        <p className="text-slate-500">Pattern dominant</p>
        <p className="font-mono text-slate-300">{o.topPatternType ?? "—"}</p>
      </div>
    </div>
  );
}
