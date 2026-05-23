"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchStabilizationOverview } from "./stabilization-api";
import {
  StabilizationDependencySurface,
  StabilizationHistorySurface,
  StabilizationOverviewSurface,
  StabilizationPressureSurface,
  StabilizationResilienceSurface,
  StabilizationSystemicSurface,
} from "./stabilization-surfaces";

export function RelationalEconomicStabilizationPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  stabilizationEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, stabilizationEnabled, realtimeGateway = null, embedded = false } = props;

  const [stabilizationScore, setStabilizationScore] = useState(0);
  const [resilienceLevel, setResilienceLevel] = useState(0);
  const [instabilityPressure, setInstabilityPressure] = useState(0);
  const [systemicExposure, setSystemicExposure] = useState(0);
  const [dependencyCount, setDependencyCount] = useState(0);
  const [signalCount, setSignalCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !stabilizationEnabled || !relationshipId) {
      setStabilizationScore(0);
      setResilienceLevel(0);
      setInstabilityPressure(0);
      setSystemicExposure(0);
      setDependencyCount(0);
      setSignalCount(0);
      return;
    }
    const ov = await fetchStabilizationOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setStabilizationScore(Number(node.stabilizationScore ?? 0));
        setResilienceLevel(Number(node.resilienceLevel ?? 0));
        setInstabilityPressure(Number(node.instabilityPressure ?? 0));
        setSystemicExposure(Number(node.systemicExposure ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const deps = (ov.data as { dependencies?: unknown[] }).dependencies;
      setDependencyCount(Array.isArray(deps) ? deps.length : 0);
    }
  }, [organizationId, relationshipId, stabilizationEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!stabilizationEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Stabilisation économique désactivée (<span className="font-mono">relational_economic_stabilization_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-teal-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-economic-stabilization-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teal-200/80">
        Stabilisation économique multi-corridor — résilience stratégique
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">analytique et gouvernance — pas exécution opérationnelle</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <StabilizationOverviewSurface stabilizationScore={stabilizationScore} resilienceLevel={resilienceLevel} />
        <StabilizationPressureSurface instabilityPressure={instabilityPressure} />
        <StabilizationResilienceSurface resilienceLevel={resilienceLevel} />
        <StabilizationDependencySurface dependencyCount={dependencyCount} />
        <StabilizationHistorySurface signalCount={signalCount} />
        <StabilizationSystemicSurface systemicExposure={systemicExposure} />
      </div>
    </section>
  );
}
