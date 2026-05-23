"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchStrategicObservatoryOverview } from "./strategic-observatory-api";
import {
  StrategicObservatoryGridSurface,
  StrategicObservatoryHistorySurface,
  StrategicObservatoryOverviewSurface,
  StrategicObservatoryPressureSurface,
  StrategicObservatoryPrioritySurface,
  StrategicObservatorySystemicSurface,
} from "./strategic-observatory-surfaces";

export function RelationalStrategicObservatoryPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  observatoryEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, observatoryEnabled, realtimeGateway = null, embedded = false } = props;

  const [observatoryScore, setSynthesisScore] = useState(0);
  const [resilienceStrength, setResilienceStrength] = useState(0);
  const [systemicPressure, setSystemicPressure] = useState(0);
  const [executiveExposure, setExecutiveExposure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [gridCount, setGridCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !observatoryEnabled || !relationshipId) {
      setSynthesisScore(0);
      setResilienceStrength(0);
      setSystemicPressure(0);
      setExecutiveExposure(0);
      setExecutiveUrgency(0);
      setStrategicAlignmentScore(0);
      setSignalCount(0);
      setGridCount(0);
      return;
    }
    const ov = await fetchStrategicObservatoryOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setSynthesisScore(Number(node.observatoryScore ?? 0));
        setResilienceStrength(Number(node.resilienceStrength ?? 0));
        setSystemicPressure(Number(node.systemicPressure ?? 0));
        setExecutiveExposure(Number(node.executiveExposure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicAlignmentScore(Number(node.strategicAlignmentScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const matrices = (ov.data as { matrices?: unknown[] }).matrices;
      setGridCount(Array.isArray(matrices) ? matrices.length : 0);
    }
  }, [organizationId, relationshipId, observatoryEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!observatoryEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Supervision exécutive globale désactivée (
        <span className="font-mono">relational_strategic_observatory_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-strategic-observatory-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Supervision exécutive globale — matrices consolidées déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">supervision globale institutionnelle — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <StrategicObservatoryOverviewSurface observatoryScore={observatoryScore} resilienceStrength={resilienceStrength} />
        <StrategicObservatoryPressureSurface executiveExposure={executiveExposure} systemicPressure={systemicPressure} />
        <StrategicObservatoryPrioritySurface executiveUrgency={executiveUrgency} />
        <StrategicObservatoryGridSurface gridCount={gridCount} />
        <StrategicObservatoryHistorySurface signalCount={signalCount} />
        <StrategicObservatorySystemicSurface strategicAlignmentScore={strategicAlignmentScore} />
      </div>
    </section>
  );
}
