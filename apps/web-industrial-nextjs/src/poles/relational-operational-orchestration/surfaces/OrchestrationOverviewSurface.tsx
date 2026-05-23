"use client";

import type { RelationalOperationalOrchestrationOverviewDto } from "@venext/shared-contracts";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function OrchestrationOverviewSurface(props: { overview: RelationalOperationalOrchestrationOverviewDto | null }) {
  const { overview } = props;
  if (!overview) {
    return <VenextInlineSkeleton variant="table" className="p-1" />;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2" data-testid="orchestration-overview-grid">
      <Stat label="Actives" value={String(overview.activeCount)} testId="orch-active" />
      <Stat label="En validation" value={String(overview.waitingValidationCount)} testId="orch-waiting" />
      <Stat label="Critiques" value={String(overview.criticalCount)} testId="orch-critical" />
      <Stat
        label="Progression étapes"
        value={`${Math.round(overview.completedStepsRatio * 100)}%`}
        testId="orch-progress"
      />
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
