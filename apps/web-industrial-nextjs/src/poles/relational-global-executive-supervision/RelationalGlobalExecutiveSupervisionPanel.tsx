"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchGlobalExecutiveSupervisionOverview } from "./global-executive-supervision-api";
import {
  GlobalExecutiveSupervisionMatrixSurface,
  GlobalExecutiveSupervisionHistorySurface,
  GlobalExecutiveSupervisionOverviewSurface,
  GlobalExecutiveSupervisionPressureSurface,
  GlobalExecutiveSupervisionPrioritySurface,
  GlobalExecutiveSupervisionSystemicSurface,
} from "./global-executive-supervision-surfaces";

export function RelationalGlobalExecutiveSupervisionPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  supervisionEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, supervisionEnabled, realtimeGateway = null, embedded = false } = props;

  const [supervisionScore, setSynthesisScore] = useState(0);
  const [resilienceStrength, setResilienceStrength] = useState(0);
  const [systemicExposure, setSystemicExposure] = useState(0);
  const [executivePressure, setExecutivePressure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [matrixCount, setMatrixCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !supervisionEnabled || !relationshipId) {
      setSynthesisScore(0);
      setResilienceStrength(0);
      setSystemicExposure(0);
      setExecutivePressure(0);
      setExecutiveUrgency(0);
      setStrategicAlignmentScore(0);
      setSignalCount(0);
      setMatrixCount(0);
      return;
    }
    const ov = await fetchGlobalExecutiveSupervisionOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setSynthesisScore(Number(node.supervisionScore ?? 0));
        setResilienceStrength(Number(node.resilienceStrength ?? 0));
        setSystemicExposure(Number(node.systemicExposure ?? 0));
        setExecutivePressure(Number(node.executivePressure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicAlignmentScore(Number(node.strategicAlignmentScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const matrices = (ov.data as { matrices?: unknown[] }).matrices;
      setMatrixCount(Array.isArray(matrices) ? matrices.length : 0);
    }
  }, [organizationId, relationshipId, supervisionEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!supervisionEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Supervision exécutive globale désactivée (
        <span className="font-mono">relational_global_executive_supervision_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-global-executive-supervision-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Supervision exécutive globale — matrices consolidées déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">supervision globale institutionnelle — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <GlobalExecutiveSupervisionOverviewSurface supervisionScore={supervisionScore} resilienceStrength={resilienceStrength} />
        <GlobalExecutiveSupervisionPressureSurface executivePressure={executivePressure} systemicExposure={systemicExposure} />
        <GlobalExecutiveSupervisionPrioritySurface executiveUrgency={executiveUrgency} />
        <GlobalExecutiveSupervisionMatrixSurface matrixCount={matrixCount} />
        <GlobalExecutiveSupervisionHistorySurface signalCount={signalCount} />
        <GlobalExecutiveSupervisionSystemicSurface strategicAlignmentScore={strategicAlignmentScore} />
      </div>
    </section>
  );
}
