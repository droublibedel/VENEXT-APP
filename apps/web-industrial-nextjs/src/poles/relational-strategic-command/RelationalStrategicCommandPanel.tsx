"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchStrategicCommandOverview } from "./strategic-command-api";
import {
  StrategicCommandGridSurface,
  StrategicCommandHistorySurface,
  StrategicCommandOverviewSurface,
  StrategicCommandPressureSurface,
  StrategicCommandPrioritySurface,
  StrategicCommandSystemicSurface,
} from "./strategic-command-surfaces";

export function RelationalStrategicCommandPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  commandEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, commandEnabled, realtimeGateway = null, embedded = false } = props;

  const [commandScore, setCommandScore] = useState(0);
  const [resilienceStrength, setResilienceStrength] = useState(0);
  const [executiveConcentration, setExecutiveConcentration] = useState(0);
  const [systemicPressure, setSystemicPressure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicBalanceScore, setStrategicBalanceScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [gridCount, setGridCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !commandEnabled || !relationshipId) {
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
    const ov = await fetchStrategicCommandOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setCommandScore(Number(node.commandScore ?? 0));
        setResilienceStrength(Number(node.resilienceStrength ?? 0));
        setExecutiveConcentration(Number(node.executiveConcentration ?? 0));
        setSystemicPressure(Number(node.systemicPressure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicBalanceScore(Number(node.strategicBalanceScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const grids = (ov.data as { grids?: unknown[] }).grids;
      setGridCount(Array.isArray(grids) ? grids.length : 0);
    }
  }, [organizationId, relationshipId, commandEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!commandEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Command center stratégique désactivé (<span className="font-mono">relational_strategic_command_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-strategic-command-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Command center stratégique — grilles de supervision déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">supervision exécutive systémique — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <StrategicCommandOverviewSurface commandScore={commandScore} resilienceStrength={resilienceStrength} />
        <StrategicCommandPressureSurface
          systemicPressure={systemicPressure}
          executiveConcentration={executiveConcentration}
        />
        <StrategicCommandPrioritySurface executiveUrgency={executiveUrgency} />
        <StrategicCommandGridSurface gridCount={gridCount} />
        <StrategicCommandHistorySurface signalCount={signalCount} />
        <StrategicCommandSystemicSurface strategicBalanceScore={strategicBalanceScore} />
      </div>
    </section>
  );
}
