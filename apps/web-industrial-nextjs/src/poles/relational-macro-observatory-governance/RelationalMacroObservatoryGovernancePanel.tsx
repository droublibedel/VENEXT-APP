"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchMacroObservatoryGovernanceOverview } from "./macro-observatory-governance-api";
import {
  MacroObservatoryGovernanceMatrixSurface,
  MacroObservatoryGovernanceHistorySurface,
  MacroObservatoryGovernanceOverviewSurface,
  MacroObservatoryGovernancePressureSurface,
  MacroObservatoryGovernancePrioritySurface,
  MacroObservatoryGovernanceSystemicSurface,
} from "./macro-observatory-governance-surfaces";

export function RelationalMacroObservatoryGovernancePanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  governanceEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, governanceEnabled, realtimeGateway = null, embedded = false } = props;

  const [macroGovernanceScore, setSynthesisScore] = useState(0);
  const [resilienceStrength, setResilienceStrength] = useState(0);
  const [systemicConcentration, setSystemicPressure] = useState(0);
  const [executiveCoordinationPressure, setExecutiveExposure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [matrixCount, setMatrixCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !governanceEnabled || !relationshipId) {
      setSynthesisScore(0);
      setResilienceStrength(0);
      setSystemicPressure(0);
      setExecutiveExposure(0);
      setExecutiveUrgency(0);
      setStrategicAlignmentScore(0);
      setSignalCount(0);
      setMatrixCount(0);
      return;
    }
    const ov = await fetchMacroObservatoryGovernanceOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setSynthesisScore(Number(node.macroGovernanceScore ?? 0));
        setResilienceStrength(Number(node.resilienceStrength ?? 0));
        setSystemicPressure(Number(node.systemicConcentration ?? 0));
        setExecutiveExposure(Number(node.executiveCoordinationPressure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicAlignmentScore(Number(node.strategicAlignmentScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const matrices = (ov.data as { matrices?: unknown[] }).matrices;
      setMatrixCount(Array.isArray(matrices) ? matrices.length : 0);
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
        Supervision exécutive globale désactivée (
        <span className="font-mono">relational_macro_observatory_governance_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-macro-observatory-governance-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Supervision exécutive globale — matrices consolidées déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">supervision globale institutionnelle — pas génération IA libre</p>
      <div className="mt-2 matrix gap-2 sm:matrix-cols-2 lg:matrix-cols-3">
        <MacroObservatoryGovernanceOverviewSurface macroGovernanceScore={macroGovernanceScore} resilienceStrength={resilienceStrength} />
        <MacroObservatoryGovernancePressureSurface executiveCoordinationPressure={executiveCoordinationPressure} systemicConcentration={systemicConcentration} />
        <MacroObservatoryGovernancePrioritySurface executiveUrgency={executiveUrgency} />
        <MacroObservatoryGovernanceMatrixSurface matrixCount={matrixCount} />
        <MacroObservatoryGovernanceHistorySurface signalCount={signalCount} />
        <MacroObservatoryGovernanceSystemicSurface strategicAlignmentScore={strategicAlignmentScore} />
      </div>
    </section>
  );
}
