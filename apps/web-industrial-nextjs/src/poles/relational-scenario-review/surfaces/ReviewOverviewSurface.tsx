"use client";

import type { RelationalScenarioReviewOverviewDto } from "@venext/shared-contracts";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function ReviewOverviewSurface(props: { overview: RelationalScenarioReviewOverviewDto | null }) {
  const o = props.overview;
  if (!o) {
    return <VenextInlineSkeleton variant="table" className="p-1" />;
  }
  return (
    <div className="grid grid-cols-2 gap-2 text-[9px] sm:grid-cols-3" data-testid="review-overview">
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">En attente</p>
        <p className="font-mono text-slate-200">{o.pendingCount}</p>
      </div>
      <div className="rounded border border-slate-800 px-2 py-1">
        <p className="text-slate-500">Analyse</p>
        <p className="font-mono text-slate-200">{o.underAnalysisCount}</p>
      </div>
      <div className="rounded border border-emerald-900/40 px-2 py-1">
        <p className="text-slate-500">Approuvées</p>
        <p className="font-mono text-emerald-200/90">{o.approvedCount}</p>
      </div>
      <div className="rounded border border-rose-900/40 px-2 py-1">
        <p className="text-slate-500">Rejetées</p>
        <p className="font-mono text-rose-200/90">{o.rejectedCount}</p>
      </div>
      <div className="rounded border border-amber-900/40 px-2 py-1">
        <p className="text-slate-500">Validation exécutive</p>
        <p className="font-mono text-amber-200/90">{o.executiveValidationCount}</p>
      </div>
      <div className="rounded border border-rose-950/50 px-2 py-1">
        <p className="text-slate-500">Critiques ouvertes</p>
        <p className="font-mono text-rose-100">{o.criticalOpenCount}</p>
      </div>
    </div>
  );
}
