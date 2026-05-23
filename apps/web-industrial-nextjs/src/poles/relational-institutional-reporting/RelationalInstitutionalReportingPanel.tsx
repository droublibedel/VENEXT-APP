"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchInstitutionalReportingOverview } from "./institutional-reporting-api";
import {
  InstitutionalReportingBriefSurface,
  InstitutionalReportingHistorySurface,
  InstitutionalReportingOverviewSurface,
  InstitutionalReportingPressureSurface,
  InstitutionalReportingPrioritySurface,
  InstitutionalReportingSystemicSurface,
} from "./institutional-reporting-surfaces";

export function RelationalInstitutionalReportingPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  reportingEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, reportingEnabled, realtimeGateway = null, embedded = false } = props;

  const [institutionalScore, setInstitutionalScore] = useState(0);
  const [strategicResilience, setStrategicResilience] = useState(0);
  const [executiveRisk, setExecutiveRisk] = useState(0);
  const [systemicExposure, setSystemicExposure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [briefCount, setBriefCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !reportingEnabled || !relationshipId) {
      setInstitutionalScore(0);
      setStrategicResilience(0);
      setExecutiveRisk(0);
      setSystemicExposure(0);
      setExecutiveUrgency(0);
      setStrategicAlignmentScore(0);
      setSignalCount(0);
      setBriefCount(0);
      return;
    }
    const ov = await fetchInstitutionalReportingOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setInstitutionalScore(Number(node.institutionalScore ?? 0));
        setStrategicResilience(Number(node.strategicResilience ?? 0));
        setExecutiveRisk(Number(node.executiveRisk ?? 0));
        setSystemicExposure(Number(node.systemicExposure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicAlignmentScore(Number(node.strategicAlignmentScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const briefs = (ov.data as { briefs?: unknown[] }).briefs;
      setBriefCount(Array.isArray(briefs) ? briefs.length : 0);
    }
  }, [organizationId, relationshipId, reportingEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!reportingEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Reporting institutionnel désactivé (<span className="font-mono">relational_institutional_reporting_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-sky-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-institutional-reporting-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-200/80">
        Reporting institutionnel — briefs stratégiques déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">analytique et audité — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <InstitutionalReportingOverviewSurface
          institutionalScore={institutionalScore}
          strategicResilience={strategicResilience}
        />
        <InstitutionalReportingPressureSurface executiveRisk={executiveRisk} systemicExposure={systemicExposure} />
        <InstitutionalReportingPrioritySurface executiveUrgency={executiveUrgency} />
        <InstitutionalReportingBriefSurface briefCount={briefCount} />
        <InstitutionalReportingHistorySurface signalCount={signalCount} />
        <InstitutionalReportingSystemicSurface strategicAlignmentScore={strategicAlignmentScore} />
      </div>
    </section>
  );
}
