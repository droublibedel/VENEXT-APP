"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchGovernanceOverview } from "./governance-api";
import {
  GovernanceBalanceSurface,
  GovernanceConflictSurface,
  GovernanceOverviewSurface,
  GovernancePrioritySurface,
  GovernanceSystemicSurface,
} from "./governance-surfaces";

export function RelationalEconomicGovernancePanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  governanceEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, governanceEnabled, realtimeGateway = null, embedded = false } = props;

  const [governanceScore, setGovernanceScore] = useState(0);
  const [coordinationScore, setCoordinationScore] = useState(0);
  const [interventionUrgency, setInterventionUrgency] = useState(0);
  const [governanceStability, setGovernanceStability] = useState(0);
  const [systemicRisk, setSystemicRisk] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !governanceEnabled || !relationshipId) {
      setGovernanceScore(0);
      setCoordinationScore(0);
      setInterventionUrgency(0);
      setGovernanceStability(0);
      setSystemicRisk(0);
      setConflictCount(0);
      return;
    }
    const ov = await fetchGovernanceOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node: Record<string, unknown> }).node;
      setGovernanceScore(Number(node.governanceScore ?? 0));
      setCoordinationScore(Number(node.coordinationScore ?? 0));
      setInterventionUrgency(Number(node.interventionUrgency ?? 0));
      setGovernanceStability(Number(node.governanceStability ?? 0));
      setSystemicRisk(Number(node.systemicRisk ?? 0));
      const conflicts = (ov.data as { conflicts?: unknown[] }).conflicts;
      setConflictCount(Array.isArray(conflicts) ? conflicts.length : 0);
    }
  }, [organizationId, relationshipId, governanceEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!governanceEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Gouvernance économique désactivée (<span className="font-mono">relational_economic_governance_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-indigo-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-economic-governance-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-200/80">
        Gouvernance économique multi-corridor — observation uniquement
      </p>
      <p className="mt-1 text-[9px] text-slate-500">Pas autopilot — aucune mutation commerciale ou logistique.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <GovernanceOverviewSurface governanceScore={governanceScore} coordinationScore={coordinationScore} />
        <GovernanceConflictSurface conflictCount={conflictCount} />
        <GovernancePrioritySurface interventionUrgency={interventionUrgency} />
        <GovernanceBalanceSurface governanceStability={governanceStability} />
        <GovernanceSystemicSurface systemicRisk={systemicRisk} />
      </div>
    </section>
  );
}
