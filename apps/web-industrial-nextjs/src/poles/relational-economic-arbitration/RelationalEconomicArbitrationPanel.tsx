"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchArbitrationOverview } from "./arbitration-api";
import {
  ArbitrationConflictSurface,
  ArbitrationDecisionSurface,
  ArbitrationHistorySurface,
  ArbitrationOverviewSurface,
  ArbitrationPrioritySurface,
  ArbitrationScenarioSurface,
} from "./arbitration-surfaces";

export function RelationalEconomicArbitrationPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  arbitrationEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, arbitrationEnabled, realtimeGateway = null, embedded = false } = props;

  const [arbitrationScore, setArbitrationScore] = useState(0);
  const [systemicImpact, setSystemicImpact] = useState(0);
  const [interventionUrgency, setInterventionUrgency] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [scenarioCount, setScenarioCount] = useState(0);
  const [decisionCount, setDecisionCount] = useState(0);
  const [snapshotCount, setSnapshotCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !arbitrationEnabled || !relationshipId) {
      setArbitrationScore(0);
      setSystemicImpact(0);
      setInterventionUrgency(0);
      setConflictCount(0);
      setScenarioCount(0);
      setDecisionCount(0);
      setSnapshotCount(0);
      return;
    }
    const ov = await fetchArbitrationOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "case" in ov.data) {
      const c = (ov.data as { case?: Record<string, unknown> }).case;
      if (c) {
        setArbitrationScore(Number(c.arbitrationScore ?? 0));
        setSystemicImpact(Number(c.systemicImpact ?? 0));
        setInterventionUrgency(Number(c.interventionUrgency ?? 0));
      }
      const scenarios = (ov.data as { scenarios?: unknown[] }).scenarios;
      setScenarioCount(Array.isArray(scenarios) ? scenarios.length : 0);
      const decisions = (ov.data as { decisions?: unknown[] }).decisions;
      setDecisionCount(Array.isArray(decisions) ? decisions.length : 0);
      setConflictCount(Number((ov.data as { overviewDiagnostics?: { governanceConflictsUsed?: number } }).overviewDiagnostics?.governanceConflictsUsed ?? 0));
      setSnapshotCount(0);
    }
  }, [organizationId, relationshipId, arbitrationEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!arbitrationEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Arbitrage économique désactivé (<span className="font-mono">relational_economic_arbitration_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-fuchsia-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-economic-arbitration-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-fuchsia-200/80">
        Arbitrage économique relationnel — analyse et gouvernance décisionnelle
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">pas exécution paiement, wallet, pricing ni livraison</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ArbitrationOverviewSurface arbitrationScore={arbitrationScore} systemicImpact={systemicImpact} />
        <ArbitrationConflictSurface conflictCount={conflictCount} />
        <ArbitrationScenarioSurface scenarioCount={scenarioCount} />
        <ArbitrationDecisionSurface decisionCount={decisionCount} />
        <ArbitrationPrioritySurface interventionUrgency={interventionUrgency} />
        <ArbitrationHistorySurface snapshotCount={snapshotCount} />
      </div>
    </section>
  );
}
