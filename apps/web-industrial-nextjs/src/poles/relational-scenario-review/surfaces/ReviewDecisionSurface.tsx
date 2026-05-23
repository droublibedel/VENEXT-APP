"use client";

import type { RelationalScenarioReviewDto } from "@venext/shared-contracts";

export function ReviewDecisionSurface(props: {
  review: RelationalScenarioReviewDto | null;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const r = props.review;
  if (!r) {
    return <p className="text-[9px] text-slate-500">Aucune revue sélectionnée.</p>;
  }
  const canAct = ["PENDING_REVIEW", "UNDER_ANALYSIS", "PARTIALLY_APPROVED"].includes(r.reviewStatus);
  return (
    <div className="space-y-2 text-[9px]" data-testid="review-decision-surface">
      <p className="font-medium text-slate-200">{r.title}</p>
      <p className="text-slate-400">{r.description}</p>
      <p className="text-slate-500">
        Statut <span className="font-mono text-cyan-200/80">{r.reviewStatus}</span> · Sévérité{" "}
        <span className="font-mono">{r.decisionSeverity}</span>
      </p>
      {r.requiresExecutiveValidation ? (
        <p className="rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-amber-200/90">
          Validation exécutive requise avant approbation finale.
        </p>
      ) : null}
      {r.requiresDualValidation ? (
        <p className="rounded border border-cyan-900/30 bg-cyan-950/20 px-2 py-1 text-cyan-200/80">
          Double validation corridor — deux organisations distinctes doivent approuver.
        </p>
      ) : null}
      {!canAct ? (
        <p className="text-slate-500">Décision terminale — actions humaines closes.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={props.busy}
            onClick={props.onApprove}
            className="rounded border border-emerald-800/60 bg-emerald-950/40 px-2 py-1 text-emerald-200/90 disabled:opacity-50"
            data-testid="review-approve-btn"
          >
            Approuver scénario
          </button>
          <button
            type="button"
            disabled={props.busy}
            onClick={props.onReject}
            className="rounded border border-rose-800/60 bg-rose-950/40 px-2 py-1 text-rose-200/90 disabled:opacity-50"
            data-testid="review-reject-btn"
          >
            Rejeter
          </button>
        </div>
      )}
      <p className="text-[8px] text-slate-600">
        Comité opérationnel corridor — validation humaine traçable, sans exécution commerce automatique.
      </p>
    </div>
  );
}
