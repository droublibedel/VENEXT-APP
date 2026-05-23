"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  RelationalOperationalAlertListResponseDto,
  RelationalOperationalRiskOverviewDto,
  RelationalOperationalSlaSnapshotDto,
} from "@venext/shared-contracts";

import {
  fetchOperationalAlerts,
  fetchRiskOverview,
  fetchSlaSnapshot,
} from "./intelligence-api";

export function RelationalOperationalIntelligencePanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  intelligenceEnabled: boolean;
}) {
  const { organizationId, relationshipId, intelligenceEnabled } = props;
  const [alerts, setAlerts] = useState<RelationalOperationalAlertListResponseDto | null>(null);
  const [snapshot, setSnapshot] = useState<RelationalOperationalSlaSnapshotDto | null>(null);
  const [risk, setRisk] = useState<RelationalOperationalRiskOverviewDto | null>(null);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !intelligenceEnabled) return;
    void fetchOperationalAlerts(organizationId, relationshipId).then((r) => {
      if (r.ok) setAlerts(r.data);
    });
    void fetchSlaSnapshot(organizationId, relationshipId).then((r) => {
      if (r.ok) setSnapshot(r.data);
    });
    void fetchRiskOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setRisk(r.data);
    });
  }, [organizationId, relationshipId, intelligenceEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!intelligenceEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-intelligence-disabled">
        Intelligence opérationnelle désactivée (
        <span className="font-mono">relational_operational_intelligence_enabled</span>).
      </p>
    );
  }

  if (!relationshipId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-intelligence-missing-relationship">
        Sélectionnez un corridor relationnel pour afficher SLA et risques opérationnels.
      </p>
    );
  }

  return (
    <section
      className="rounded border border-slate-800 bg-slate-950/70 p-3"
      data-testid="relational-operational-intelligence"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Centre intelligence opérationnelle corridor
      </p>
      <p className="mt-1 text-[9px] text-slate-500">
        SLA exécution, dérives, saturation coordination — lecture interne B2B (pas dashboard ecommerce).
      </p>

      {snapshot ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="ops-sla-grid">
          <Stat label="Santé corridor" value={snapshot.corridorOperationalHealth} testId="ops-health" />
          <Stat label="État corridor" value={snapshot.corridorState} testId="ops-corridor-state" />
          <Stat label="Tâches bloquantes" value={String(snapshot.activeBlockingTasks)} testId="ops-blocking-tasks" />
          <Stat label="Incidents ouverts" value={String(snapshot.activeIncidentCount)} testId="ops-incidents" />
          <Stat label="Alertes ouvertes" value={String(snapshot.openOperationalAlerts)} testId="ops-alerts" />
          <Stat
            label="Délai fulfillment moy. (h)"
            value={snapshot.averageFulfillmentDurationHours?.toFixed(1) ?? "—"}
            testId="ops-fulfillment-hours"
          />
        </div>
      ) : null}

      {risk && risk.criticalAlerts > 0 ? (
        <p className="mt-2 text-[9px] text-amber-200/90" data-testid="ops-critical-risk">
          {risk.criticalAlerts} alerte(s) critique(s) — risque opérationnel corridor actif.
        </p>
      ) : null}

      <div className="mt-3">
        <p className="text-[9px] font-medium text-slate-400">Alertes opérationnelles</p>
        <ul className="mt-1 space-y-1">
          {(alerts?.alerts ?? []).slice(0, 8).map((a) => (
            <li key={a.id} className="rounded border border-slate-800/80 px-2 py-1 text-[9px] text-slate-300">
              <span className="font-mono text-amber-200/80">{a.severity}</span> — {a.title}
            </li>
          ))}
          {(alerts?.alerts ?? []).length === 0 ? (
            <li className="text-[9px] text-slate-500">Aucune alerte ouverte sur ce corridor.</li>
          ) : null}
        </ul>
      </div>
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
