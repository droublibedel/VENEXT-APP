"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchExecutiveOrchestrationOverview } from "./executive-orchestration-api";
import {
  ExecutiveOrchestrationDependencySurface,
  ExecutiveOrchestrationHistorySurface,
  ExecutiveOrchestrationOverviewSurface,
  ExecutiveOrchestrationPressureSurface,
  ExecutiveOrchestrationPrioritySurface,
  ExecutiveOrchestrationSystemicSurface,
} from "./executive-orchestration-surfaces";

export function RelationalExecutiveOrchestrationPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  orchestrationEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, orchestrationEnabled, realtimeGateway = null, embedded = false } = props;

  const [orchestrationScore, setOrchestrationScore] = useState(0);
  const [executiveResilience, setExecutiveResilience] = useState(0);
  const [executiveCoordinationPressure, setExecutiveCoordinationPressure] = useState(0);
  const [systemicExposure, setSystemicExposure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [dependencyCount, setDependencyCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !orchestrationEnabled || !relationshipId) {
      setOrchestrationScore(0);
      setExecutiveResilience(0);
      setExecutiveCoordinationPressure(0);
      setSystemicExposure(0);
      setExecutiveUrgency(0);
      setStrategicAlignmentScore(0);
      setSignalCount(0);
      setDependencyCount(0);
      return;
    }
    const ov = await fetchExecutiveOrchestrationOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setOrchestrationScore(Number(node.orchestrationScore ?? 0));
        setExecutiveResilience(Number(node.executiveResilience ?? 0));
        setExecutiveCoordinationPressure(Number(node.executiveCoordinationPressure ?? 0));
        setSystemicExposure(Number(node.systemicExposure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicAlignmentScore(Number(node.strategicAlignmentScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const deps = (ov.data as { dependencies?: unknown[] }).dependencies;
      setDependencyCount(Array.isArray(deps) ? deps.length : 0);
    }
  }, [organizationId, relationshipId, orchestrationEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!orchestrationEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Orchestration exécutive désactivée (<span className="font-mono">relational_executive_orchestration_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-fuchsia-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-executive-orchestration-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-fuchsia-200/80">
        Orchestration exécutive — matrice de supervision stratégique
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">analytique et gouvernance — pas exécution opérationnelle</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ExecutiveOrchestrationOverviewSurface
          orchestrationScore={orchestrationScore}
          executiveResilience={executiveResilience}
        />
        <ExecutiveOrchestrationPressureSurface
          executiveCoordinationPressure={executiveCoordinationPressure}
          systemicExposure={systemicExposure}
        />
        <ExecutiveOrchestrationPrioritySurface executiveUrgency={executiveUrgency} />
        <ExecutiveOrchestrationDependencySurface dependencyCount={dependencyCount} />
        <ExecutiveOrchestrationHistorySurface signalCount={signalCount} />
        <ExecutiveOrchestrationSystemicSurface strategicAlignmentScore={strategicAlignmentScore} />
      </div>
    </section>
  );
}
