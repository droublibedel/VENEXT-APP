"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchExecutiveOperationsOverview } from "./executive-operations-api";
import {
  ExecutiveOperationsGridSurface,
  ExecutiveOperationsHistorySurface,
  ExecutiveOperationsOverviewSurface,
  ExecutiveOperationsPressureSurface,
  ExecutiveOperationsPrioritySurface,
  ExecutiveOperationsSystemicSurface,
} from "./executive-operations-surfaces";

export function RelationalExecutiveOperationsPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  operationsEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, operationsEnabled, realtimeGateway = null, embedded = false } = props;

  const [executiveOperationsScore, setCommandScore] = useState(0);
  const [resilienceStrength, setResilienceStrength] = useState(0);
  const [systemicConcentration, setExecutiveConcentration] = useState(0);
  const [executivePressure, setSystemicPressure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicBalanceScore, setStrategicBalanceScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [matrixCount, setGridCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !operationsEnabled || !relationshipId) {
      setCommandScore(0);
      setResilienceStrength(0);
      setExecutiveConcentration(0);
      setSystemicPressure(0);
      setExecutiveUrgency(0);
      setStrategicBalanceScore(0);
      setSignalCount(0);
      setGridCount(0);
      return;
    }
    const ov = await fetchExecutiveOperationsOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setCommandScore(Number(node.executiveOperationsScore ?? 0));
        setResilienceStrength(Number(node.resilienceStrength ?? 0));
        setExecutiveConcentration(Number(node.systemicConcentration ?? 0));
        setSystemicPressure(Number(node.executivePressure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicBalanceScore(Number(node.strategicBalanceScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const matrices = (ov.data as { matrices?: unknown[] }).matrices;
      setGridCount(Array.isArray(matrices) ? matrices.length : 0);
    }
  }, [organizationId, relationshipId, operationsEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!operationsEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Executive operations stratégique désactivé (<span className="font-mono">relational_executive_operations_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-executive-operations-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Executive operations stratégique — grilles de supervision déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">supervision exécutive systémique — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ExecutiveOperationsOverviewSurface executiveOperationsScore={executiveOperationsScore} resilienceStrength={resilienceStrength} />
        <ExecutiveOperationsPressureSurface
          executivePressure={executivePressure}
          systemicConcentration={systemicConcentration}
        />
        <ExecutiveOperationsPrioritySurface executiveUrgency={executiveUrgency} />
        <ExecutiveOperationsGridSurface matrixCount={matrixCount} />
        <ExecutiveOperationsHistorySurface signalCount={signalCount} />
        <ExecutiveOperationsSystemicSurface strategicBalanceScore={strategicBalanceScore} />
      </div>
    </section>
  );
}
