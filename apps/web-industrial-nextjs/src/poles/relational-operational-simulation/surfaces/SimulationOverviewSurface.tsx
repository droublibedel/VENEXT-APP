"use client";

import type { RelationalOperationalSimulationOverviewDto } from "@venext/shared-contracts";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function SimulationOverviewSurface(props: { overview: RelationalOperationalSimulationOverviewDto | null }) {
  if (!props.overview) return <VenextInlineSkeleton variant="table" className="p-1" />;
  const o = props.overview;
  return (
    <div className="grid gap-2 sm:grid-cols-2" data-testid="simulation-overview-grid">
      <Stat label="Terminées" value={String(o.completedCount)} testId="sim-completed" />
      <Stat label="En cours" value={String(o.runningCount)} testId="sim-running" />
      <Stat label="Risque élevé" value={String(o.highRiskCount)} testId="sim-high-risk" />
      <Stat label="Risque collapse" value={String(o.collapseRiskCount)} testId="sim-collapse" />
    </div>
  );
}

function Stat(props: { label: string; value: string; testId: string }) {
  return (
    <div className="rounded border border-slate-800/60 px-2 py-1.5" data-testid={props.testId}>
      <p className="text-[8px] uppercase tracking-wider text-slate-500">{props.label}</p>
      <p className="text-[10px] font-medium text-slate-200">{props.value}</p>
    </div>
  );
}
