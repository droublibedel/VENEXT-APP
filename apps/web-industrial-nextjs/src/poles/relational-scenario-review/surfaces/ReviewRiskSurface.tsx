"use client";

import type { RelationalScenarioReviewDto } from "@venext/shared-contracts";

export function ReviewRiskSurface(props: { review: RelationalScenarioReviewDto | null }) {
  const r = props.review;
  if (!r) {
    return <p className="text-[9px] text-slate-500">Risques corridor non disponibles.</p>;
  }
  return (
    <div className="rounded border border-amber-900/30 bg-amber-950/10 px-2 py-2 text-[9px]" data-testid="review-risk-surface">
      <p className="font-medium text-amber-200/90">Synthèse risque décisionnel</p>
      <p className="mt-1 text-slate-400">
        Type décision <span className="font-mono text-slate-300">{r.decisionType}</span>
      </p>
      <p className="mt-1 text-slate-500">
        Propagation effondrement et fragilité corridor évaluées via simulation source — lecture analytique uniquement.
      </p>
      {r.simulationId ? (
        <p className="mt-1 font-mono text-[8px] text-slate-600">simulationId={r.simulationId}</p>
      ) : null}
    </div>
  );
}
