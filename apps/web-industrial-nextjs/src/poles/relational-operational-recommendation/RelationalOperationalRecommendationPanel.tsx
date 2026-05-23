"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  RelationalOperationalRecommendationDto,
  RelationalOperationalRecommendationListDto,
  RelationalOperationalRecommendationOverviewDto,
} from "@venext/shared-contracts";

import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";
import {
  acknowledgeRecommendation,
  fetchRecommendationOverview,
  fetchRecommendations,
} from "./recommendation-api";

export function RelationalOperationalRecommendationPanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  recommendationEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeEvent?: string | null;
}) {
  const { organizationId, relationshipId, recommendationEnabled, realtimeEnabled, lastRealtimeEvent } = props;
  const [list, setList] = useState<RelationalOperationalRecommendationListDto | null>(null);
  const [overview, setOverview] = useState<RelationalOperationalRecommendationOverviewDto | null>(null);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !recommendationEnabled) return;
    void fetchRecommendations(organizationId, relationshipId).then((r) => {
      if (r.ok) setList(r.data);
    });
    void fetchRecommendationOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setOverview(r.data);
    });
  }, [organizationId, relationshipId, recommendationEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!recommendationEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-recommendation-disabled">
        Recommandations opérationnelles désactivées (
        <span className="font-mono">relational_operational_recommendation_enabled</span>).
      </p>
    );
  }

  if (!relationshipId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-recommendation-missing-relationship">
        Corridor requis pour les recommandations déterministes (SLA, incidents, gouvernance).
      </p>
    );
  }

  const recommendations = list?.recommendations ?? [];
  const priority = [...recommendations].sort((a, b) => b.recommendationScore - a.recommendationScore);
  const riskItems = priority.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH");
  const governanceItems = priority.filter(
    (r) =>
      r.recommendationType === "CORRIDOR_GOVERNANCE_RECOMMENDATION" ||
      r.recommendationType === "COLLAPSE_PREVENTION_RECOMMENDATION",
  );

  return (
    <section className="flex flex-col gap-3" data-testid="relational-operational-recommendation">
      <div className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="recommendation-overview">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Vue synthèse</p>
        {overview ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Stat label="Actives" value={String(overview.activeCount)} testId="rec-active" />
            <Stat label="Critiques" value={String(overview.criticalCount)} testId="rec-critical" />
            <Stat label="Priorité haute" value={String(overview.highPriorityCount)} testId="rec-high" />
            <Stat label="Score moyen" value={overview.averageScore.toFixed(1)} testId="rec-avg-score" />
          </div>
        ) : (
          <VenextInlineSkeleton variant="pole" className="mt-2 py-2" />
        )}
        <p className="mt-2 text-[8px] text-slate-600">
          Lecture interne — exécution paiement désactivée · suivi public désactivé.
        </p>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="recommendation-priority">
        <p className="text-[9px] font-medium text-slate-400">Priorités opérationnelles</p>
        <RecommendationList
          items={priority.slice(0, 8)}
          onAck={organizationId ? (id) => void onAck(organizationId, id, reload) : undefined}
        />
      </div>

      <div className="rounded border border-amber-900/30 bg-amber-950/20 p-3" data-testid="recommendation-risk">
        <p className="text-[9px] font-medium text-amber-200/80">Risques &amp; dérives</p>
        <RecommendationList items={riskItems.slice(0, 5)} compact />
      </div>

      <div className="rounded border border-cyan-900/30 bg-cyan-950/15 p-3" data-testid="recommendation-governance">
        <p className="text-[9px] font-medium text-cyan-200/80">Gouvernance corridor</p>
        <RecommendationList items={governanceItems.slice(0, 4)} compact />
        {governanceItems.length === 0 ? (
          <p className="mt-1 text-[9px] text-slate-500">Aucune recommandation gouvernance active.</p>
        ) : null}
      </div>

      <div
        className="rounded border border-slate-800/80 px-2 py-1.5 text-[8px] text-slate-500"
        data-testid="recommendation-realtime-strip"
      >
        Temps réel{" "}
        {realtimeEnabled ? (
          <span className="text-cyan-300/80">
            {lastRealtimeEvent ? `— ${lastRealtimeEvent}` : "— en écoute relational.operational.recommendation_*"}
          </span>
        ) : (
          <span className="font-mono">relational_operational_recommendation_realtime_enabled=off</span>
        )}
      </div>
    </section>
  );
}

async function onAck(organizationId: string, id: string, reload: () => void) {
  const r = await acknowledgeRecommendation(organizationId, id);
  if (r.ok) reload();
}

function RecommendationList(props: {
  items: RelationalOperationalRecommendationDto[];
  compact?: boolean;
  onAck?: (id: string) => void;
}) {
  if (props.items.length === 0) {
    return <p className="mt-1 text-[9px] text-slate-500">Aucune recommandation active.</p>;
  }
  return (
    <ul className="mt-1 space-y-1">
      {props.items.map((r) => (
        <li
          key={r.id}
          className={`rounded border border-slate-800/80 px-2 py-1 text-[9px] text-slate-300 ${props.compact ? "py-0.5" : ""}`}
        >
          <span className="font-mono text-amber-200/80">{r.severity}</span> — {r.title}{" "}
          <span className="text-slate-500">(score {r.recommendationScore})</span>
          {!props.compact && props.onAck && r.status === "ACTIVE" ? (
            <button
              type="button"
              className="ml-2 text-[8px] uppercase tracking-wider text-cyan-400/90"
              onClick={() => props.onAck!(r.id)}
            >
              Accuser réception
            </button>
          ) : null}
        </li>
      ))}
    </ul>
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
