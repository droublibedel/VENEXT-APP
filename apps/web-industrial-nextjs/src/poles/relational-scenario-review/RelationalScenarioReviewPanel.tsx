"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RelationalScenarioReviewDto, RelationalScenarioReviewListDto, RelationalScenarioReviewOverviewDto } from "@venext/shared-contracts";

import { approveReview, fetchReviewOverview, fetchReviews, rejectReview } from "./review-api";
import { ReviewDecisionSurface } from "./surfaces/ReviewDecisionSurface";
import { ReviewOverviewSurface } from "./surfaces/ReviewOverviewSurface";
import { ReviewRealtimeStrip } from "./surfaces/ReviewRealtimeStrip";
import { ReviewRiskSurface } from "./surfaces/ReviewRiskSurface";

export function RelationalScenarioReviewPanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  reviewEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeEvent?: string | null;
}) {
  const { organizationId, relationshipId, reviewEnabled, realtimeEnabled, lastRealtimeEvent } = props;
  const [list, setList] = useState<RelationalScenarioReviewListDto | null>(null);
  const [overview, setOverview] = useState<RelationalScenarioReviewOverviewDto | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !reviewEnabled) return;
    void fetchReviews(organizationId, relationshipId).then((r) => {
      if (r.ok) setList(r.data);
    });
    void fetchReviewOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setOverview(r.data);
    });
  }, [organizationId, relationshipId, reviewEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const selected: RelationalScenarioReviewDto | null = useMemo(() => {
    if (!list || !selectedId) return list?.reviews[0] ?? null;
    return list.reviews.find((r) => r.id === selectedId) ?? list.reviews[0] ?? null;
  }, [list, selectedId]);

  useEffect(() => {
    if (list?.reviews.length && !selectedId) setSelectedId(list.reviews[0]!.id);
  }, [list, selectedId]);

  if (!reviewEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="scenario-review-disabled">
        Revue scénario désactivée (<span className="font-mono">relational_scenario_review_enabled</span>).
      </p>
    );
  }

  if (!relationshipId || !organizationId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="scenario-review-missing-relationship">
        Corridor requis pour le comité de revue décisionnelle humaine.
      </p>
    );
  }

  const act = async (kind: "approve" | "reject") => {
    if (!selected || !organizationId) return;
    const summary =
      kind === "approve"
        ? "Approbation humaine corridor — plan orchestral autorisé en brouillon."
        : "Rejet humain — scénario non retenu.";
    setBusy(true);
    const res =
      kind === "approve"
        ? await approveReview(organizationId, selected.id, summary)
        : await rejectReview(organizationId, selected.id, summary, "Rejet comité opérationnel corridor.");
    setBusy(false);
    if (res.ok) reload();
  };

  return (
    <section
      className="rounded border border-violet-900/40 bg-slate-950/80 p-3"
      data-testid="relational-scenario-review-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200/90">
        Revue scénario & décision humaine
      </p>
      <p className="mt-1 text-[9px] text-slate-500">
        Comité opérationnel numérique — comparaison projections, validation traçable, sans autopilot commerce.
      </p>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/70 p-3">
        <ReviewOverviewSurface overview={overview} />
      </div>

      {list && list.reviews.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {list.reviews.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className={`rounded border px-2 py-0.5 text-[8px] font-mono ${
                selected?.id === r.id
                  ? "border-violet-700/60 bg-violet-950/40 text-violet-200"
                  : "border-slate-800 text-slate-500"
              }`}
            >
              {r.reviewStatus}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[9px] font-medium text-slate-400">Décision</p>
          <ReviewDecisionSurface review={selected} busy={busy} onApprove={() => void act("approve")} onReject={() => void act("reject")} />
        </div>
        <div className="rounded border border-amber-900/30 bg-amber-950/20 p-3">
          <p className="text-[9px] font-medium text-slate-400">Risque corridor</p>
          <ReviewRiskSurface review={selected} />
        </div>
      </div>

      <ReviewRealtimeStrip realtimeEnabled={realtimeEnabled} lastEvent={lastRealtimeEvent ?? null} />
    </section>
  );
}
