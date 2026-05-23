"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchRecoveryOverview } from "./recovery-api";
import {
  RecoveryDependencySurface,
  RecoveryOverviewSurface,
  RecoveryPrioritySurface,
  RecoveryRiskSurface,
  RecoverySystemicSurface,
} from "./recovery-surfaces";

export function RelationalEconomicRecoveryPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  recoveryEnabled: boolean;
  realtimeEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, recoveryEnabled, realtimeGateway = null, embedded = false } = props;

  const [recoveryScore, setRecoveryScore] = useState(0);
  const [instabilityScore, setInstabilityScore] = useState(0);
  const [interventionPriority, setInterventionPriority] = useState(0);
  const [systemicImpactRisk, setSystemicImpactRisk] = useState(0);
  const [corridorRecoveryProbability, setCorridorRecoveryProbability] = useState(0);
  const [stepCount, setStepCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !recoveryEnabled || !relationshipId) {
      setRecoveryScore(0);
      setInstabilityScore(0);
      setInterventionPriority(0);
      setSystemicImpactRisk(0);
      setCorridorRecoveryProbability(0);
      setStepCount(0);
      return;
    }
    const ov = await fetchRecoveryOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "plan" in ov.data) {
      const plan = (ov.data as { plan: Record<string, unknown> }).plan;
      setRecoveryScore(Number(plan.recoveryScore ?? 0));
      setInstabilityScore(Number(plan.instabilityScore ?? 0));
      setInterventionPriority(Number(plan.interventionPriority ?? 0));
      setSystemicImpactRisk(Number(plan.systemicImpactRisk ?? 0));
      setCorridorRecoveryProbability(Number(plan.corridorRecoveryProbability ?? 0));
      const steps = (ov.data as { steps?: unknown[] }).steps;
      setStepCount(Array.isArray(steps) ? steps.length : 0);
    }
  }, [organizationId, relationshipId, recoveryEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!recoveryEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Recovery planning désactivé (<span className="font-mono">relational_economic_recovery_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-economic-recovery-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Recovery planning — planification uniquement
      </p>
      <p className="mt-1 text-[9px] text-slate-500">Pas autopilot — aucune mutation commande, paiement ou livraison.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <RecoveryOverviewSurface recoveryScore={recoveryScore} instabilityScore={instabilityScore} />
        <RecoveryPrioritySurface interventionPriority={interventionPriority} />
        <RecoveryDependencySurface stepCount={stepCount} />
        <RecoveryRiskSurface systemicImpactRisk={systemicImpactRisk} />
        <RecoverySystemicSurface corridorRecoveryProbability={corridorRecoveryProbability} />
      </div>
    </section>
  );
}
