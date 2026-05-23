"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchMonitoringOverview } from "./monitoring-api";
import {
  MonitoringAlertSurface,
  MonitoringHistorySurface,
  MonitoringOverviewSurface,
  MonitoringPressureSurface,
  MonitoringPrioritySurface,
  MonitoringSystemicSurface,
} from "./monitoring-surfaces";

export function RelationalEconomicMonitoringPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  monitoringEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, monitoringEnabled, realtimeGateway = null, embedded = false } = props;

  const [monitoringScore, setMonitoringScore] = useState(0);
  const [resilienceLevel, setResilienceLevel] = useState(0);
  const [executivePressure, setExecutivePressure] = useState(0);
  const [systemicRisk, setSystemicRisk] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [coordinationPressure, setCoordinationPressure] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !monitoringEnabled || !relationshipId) {
      setMonitoringScore(0);
      setResilienceLevel(0);
      setExecutivePressure(0);
      setSystemicRisk(0);
      setExecutiveUrgency(0);
      setCoordinationPressure(0);
      setSignalCount(0);
      setAlertCount(0);
      return;
    }
    const ov = await fetchMonitoringOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setMonitoringScore(Number(node.monitoringScore ?? 0));
        setResilienceLevel(Number(node.resilienceLevel ?? 0));
        setExecutivePressure(Number(node.executivePressure ?? 0));
        setSystemicRisk(Number(node.systemicRisk ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setCoordinationPressure(Number(node.coordinationPressure ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const alerts = (ov.data as { alerts?: unknown[] }).alerts;
      setAlertCount(Array.isArray(alerts) ? alerts.length : 0);
    }
  }, [organizationId, relationshipId, monitoringEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!monitoringEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Supervision économique désactivée (<span className="font-mono">relational_economic_monitoring_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-indigo-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-economic-monitoring-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-200/80">
        Supervision stratégique exécutive — contrôle relationnel
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">analytique et gouvernance — pas exécution opérationnelle</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <MonitoringOverviewSurface monitoringScore={monitoringScore} resilienceLevel={resilienceLevel} />
        <MonitoringPressureSurface executivePressure={executivePressure} systemicRisk={systemicRisk} />
        <MonitoringPrioritySurface executiveUrgency={executiveUrgency} />
        <MonitoringAlertSurface alertCount={alertCount} />
        <MonitoringHistorySurface signalCount={signalCount} />
        <MonitoringSystemicSurface coordinationPressure={coordinationPressure} />
      </div>
    </section>
  );
}
