"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchExecutiveControlRoomOverview } from "./executive-control-room-api";
import {
  ExecutiveControlRoomBoardSurface,
  ExecutiveControlRoomHistorySurface,
  ExecutiveControlRoomOverviewSurface,
  ExecutiveControlRoomPressureSurface,
  ExecutiveControlRoomPrioritySurface,
  ExecutiveControlRoomSystemicSurface,
} from "./executive-control-room-surfaces";

export function RelationalExecutiveControlRoomPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  controlRoomEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, controlRoomEnabled, realtimeGateway = null, embedded = false } = props;

  const [controlRoomScore, setControlRoomScore] = useState(0);
  const [resilienceStrength, setResilienceStrength] = useState(0);
  const [systemicConcentration, setSystemicConcentration] = useState(0);
  const [executivePressure, setExecutivePressure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicBalanceScore, setStrategicBalanceScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [boardCount, setBoardCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !controlRoomEnabled || !relationshipId) {
      setControlRoomScore(0);
      setResilienceStrength(0);
      setSystemicConcentration(0);
      setExecutivePressure(0);
      setExecutiveUrgency(0);
      setStrategicBalanceScore(0);
      setSignalCount(0);
      setBoardCount(0);
      return;
    }
    const ov = await fetchExecutiveControlRoomOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setControlRoomScore(Number(node.controlRoomScore ?? 0));
        setResilienceStrength(Number(node.resilienceStrength ?? 0));
        setSystemicConcentration(Number(node.systemicConcentration ?? 0));
        setExecutivePressure(Number(node.executivePressure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicBalanceScore(Number(node.strategicBalanceScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const boards = (ov.data as { boards?: unknown[] }).boards;
      setBoardCount(Array.isArray(boards) ? boards.length : 0);
    }
  }, [organizationId, relationshipId, controlRoomEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!controlRoomEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Salle de contrôle exécutive désactivée (
        <span className="font-mono">relational_executive_control_room_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-executive-control-room-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Executive control room — decision boards déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">supervision exécutive institutionnelle — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ExecutiveControlRoomOverviewSurface controlRoomScore={controlRoomScore} resilienceStrength={resilienceStrength} />
        <ExecutiveControlRoomPressureSurface
          executivePressure={executivePressure}
          systemicConcentration={systemicConcentration}
        />
        <ExecutiveControlRoomPrioritySurface executiveUrgency={executiveUrgency} />
        <ExecutiveControlRoomBoardSurface boardCount={boardCount} />
        <ExecutiveControlRoomHistorySurface signalCount={signalCount} />
        <ExecutiveControlRoomSystemicSurface strategicBalanceScore={strategicBalanceScore} />
      </div>
    </section>
  );
}
