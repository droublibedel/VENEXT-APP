"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  RelationalOperationalDriftListResponseDto,
  RelationalPredictiveOverviewDto,
  RelationalPredictiveRiskSignalListResponseDto,
} from "@venext/shared-contracts";

import { fetchDriftSnapshots, fetchPredictiveOverview, fetchPredictiveSignals } from "./predictive-risk-api";

export function RelationalPredictiveRiskPanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  predictiveEnabled: boolean;
}) {
  const { organizationId, relationshipId, predictiveEnabled } = props;
  const [signals, setSignals] = useState<RelationalPredictiveRiskSignalListResponseDto | null>(null);
  const [overview, setOverview] = useState<RelationalPredictiveOverviewDto | null>(null);
  const [drift, setDrift] = useState<RelationalOperationalDriftListResponseDto | null>(null);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !predictiveEnabled) return;
    void fetchPredictiveSignals(organizationId, relationshipId).then((r) => {
      if (r.ok) setSignals(r.data);
    });
    void fetchPredictiveOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setOverview(r.data);
    });
    void fetchDriftSnapshots(organizationId, relationshipId).then((r) => {
      if (r.ok) setDrift(r.data);
    });
  }, [organizationId, relationshipId, predictiveEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!predictiveEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="predictive-risk-disabled">
        Risque prédictif désactivé (<span className="font-mono">relational_predictive_risk_enabled</span>).
      </p>
    );
  }

  if (!relationshipId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="predictive-risk-missing-relationship">
        Corridor requis pour la surveillance drift et collapse SLA.
      </p>
    );
  }

  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-predictive-risk">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Surveillance risque opérationnel déterministe
      </p>
      <p className="mt-1 text-[9px] text-slate-500">
        Drift, fragilité corridor, collapse SLA — moteur explicable (pas assistant IA marketing).
      </p>

      {overview ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="predictive-overview-grid">
          <Stat label="Risque collapse" value={`${overview.corridorCollapseRisk}/100`} testId="predictive-collapse" />
          <Stat label="Fragilité opérationnelle" value={`${overview.operationalFragility}/100`} testId="predictive-fragility" />
          <Stat label="Signaux ouverts" value={String(overview.openRiskSignals)} testId="predictive-open-signals" />
          <Stat label="Drifts actifs (7j)" value={String(overview.activeDriftSnapshots)} testId="predictive-drifts" />
        </div>
      ) : null}

      {overview?.sustainedOperationalDegradation ? (
        <p className="mt-2 text-[9px] text-amber-200/90" data-testid="predictive-sustained-degradation">
          Dégradation opérationnelle soutenue détectée sur ce corridor.
        </p>
      ) : null}

      <div className="mt-3">
        <p className="text-[9px] font-medium text-slate-400">Signaux prédictifs</p>
        <ul className="mt-1 space-y-1">
          {(signals?.signals ?? []).slice(0, 6).map((s) => (
            <li key={s.id} className="rounded border border-slate-800/80 px-2 py-1 text-[9px] text-slate-300">
              <span className="font-mono text-amber-200/80">{s.riskLevel}</span> — {s.title} (score {s.signalScore})
            </li>
          ))}
          {(signals?.signals ?? []).length === 0 ? (
            <li className="text-[9px] text-slate-500">Aucun signal prédictif ouvert.</li>
          ) : null}
        </ul>
      </div>

      {(drift?.snapshots ?? []).length > 0 ? (
        <div className="mt-3" data-testid="predictive-drift-monitor">
          <p className="text-[9px] font-medium text-slate-400">Drift opérationnel récent</p>
          <ul className="mt-1 space-y-1">
            {drift!.snapshots.slice(0, 4).map((d) => (
              <li key={d.id} className="text-[9px] text-slate-400">
                {d.driftType}: +{d.deviationPercentage}% (baseline {d.baselineMetric.toFixed(1)} → {d.currentMetric.toFixed(1)})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
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
