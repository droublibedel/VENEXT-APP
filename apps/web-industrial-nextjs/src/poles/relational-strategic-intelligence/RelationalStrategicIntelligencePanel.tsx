"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchStrategicIntelligenceOverview } from "./strategic-intelligence-api";
import {
  StrategicIntelligenceSynthesisSurface,
  StrategicIntelligenceHistorySurface,
  StrategicIntelligenceOverviewSurface,
  StrategicIntelligencePressureSurface,
  StrategicIntelligencePrioritySurface,
  StrategicIntelligenceSystemicSurface,
} from "./strategic-intelligence-surfaces";

export function RelationalStrategicIntelligencePanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  intelligenceEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, intelligenceEnabled, realtimeGateway = null, embedded = false } = props;

  const [strategicIntelligenceScore, setInstitutionalScore] = useState(0);
  const [resilienceStrength, setStrategicResilience] = useState(0);
  const [executiveExposure, setExecutiveRisk] = useState(0);
  const [systemicConcentration, setSystemicExposure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [synthesisCount, setBriefCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !intelligenceEnabled || !relationshipId) {
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
    const ov = await fetchStrategicIntelligenceOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setInstitutionalScore(Number(node.strategicIntelligenceScore ?? 0));
        setStrategicResilience(Number(node.resilienceStrength ?? 0));
        setExecutiveRisk(Number(node.executiveExposure ?? 0));
        setSystemicExposure(Number(node.systemicConcentration ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicAlignmentScore(Number(node.strategicAlignmentScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const syntheses = (ov.data as { syntheses?: unknown[] }).syntheses;
      setBriefCount(Array.isArray(syntheses) ? syntheses.length : 0);
    }
  }, [organizationId, relationshipId, intelligenceEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!intelligenceEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Consolidation stratégique désactivé (<span className="font-mono">relational_strategic_intelligence_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-indigo-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-strategic-intelligence-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-200/80">
        Consolidation stratégique — syntheses stratégiques déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">analytique et audité — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <StrategicIntelligenceOverviewSurface
          strategicIntelligenceScore={strategicIntelligenceScore}
          resilienceStrength={resilienceStrength}
        />
        <StrategicIntelligencePressureSurface executiveExposure={executiveExposure} systemicConcentration={systemicConcentration} />
        <StrategicIntelligencePrioritySurface executiveUrgency={executiveUrgency} />
        <StrategicIntelligenceSynthesisSurface synthesisCount={synthesisCount} />
        <StrategicIntelligenceHistorySurface signalCount={signalCount} />
        <StrategicIntelligenceSystemicSurface strategicAlignmentScore={strategicAlignmentScore} />
      </div>
    </section>
  );
}
