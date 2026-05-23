"use client";

import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchExecutiveStrategicSynthesisOverview } from "./executive-strategic-synthesis-api";
import {
  ExecutiveStrategicSynthesisDigestSurface,
  ExecutiveStrategicSynthesisHistorySurface,
  ExecutiveStrategicSynthesisOverviewSurface,
  ExecutiveStrategicSynthesisPressureSurface,
  ExecutiveStrategicSynthesisPrioritySurface,
  ExecutiveStrategicSynthesisSystemicSurface,
} from "./executive-strategic-synthesis-surfaces";

export function RelationalExecutiveStrategicSynthesisPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  synthesisEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, synthesisEnabled, realtimeGateway = null, embedded = false } = props;

  const [synthesisScore, setSynthesisScore] = useState(0);
  const [resilienceStrength, setResilienceStrength] = useState(0);
  const [systemicPressure, setSystemicPressure] = useState(0);
  const [executiveExposure, setExecutiveExposure] = useState(0);
  const [executiveUrgency, setExecutiveUrgency] = useState(0);
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [digestCount, setDigestCount] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !synthesisEnabled || !relationshipId) {
      setSynthesisScore(0);
      setResilienceStrength(0);
      setSystemicPressure(0);
      setExecutiveExposure(0);
      setExecutiveUrgency(0);
      setStrategicAlignmentScore(0);
      setSignalCount(0);
      setDigestCount(0);
      return;
    }
    const ov = await fetchExecutiveStrategicSynthesisOverview(organizationId, relationshipId);
    if (ov.ok && typeof ov.data === "object" && ov.data && "node" in ov.data) {
      const node = (ov.data as { node?: Record<string, unknown> }).node;
      if (node) {
        setSynthesisScore(Number(node.synthesisScore ?? 0));
        setResilienceStrength(Number(node.resilienceStrength ?? 0));
        setSystemicPressure(Number(node.systemicPressure ?? 0));
        setExecutiveExposure(Number(node.executiveExposure ?? 0));
        setExecutiveUrgency(Number(node.executiveUrgency ?? 0));
        setStrategicAlignmentScore(Number(node.strategicAlignmentScore ?? 0));
      }
      const signals = (ov.data as { signals?: unknown[] }).signals;
      setSignalCount(Array.isArray(signals) ? signals.length : 0);
      const digests = (ov.data as { digests?: unknown[] }).digests;
      setDigestCount(Array.isArray(digests) ? digests.length : 0);
    }
  }, [organizationId, relationshipId, synthesisEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  if (!synthesisEnabled) {
    return (
      <p className="px-3 py-2 text-xs text-slate-500">
        Synthèse exécutive stratégique désactivée (
        <span className="font-mono">relational_executive_strategic_synthesis_enabled</span>).
      </p>
    );
  }

  return (
    <section
      className={embedded ? "rounded border border-violet-900/30 bg-slate-950/70 p-2" : "px-3 py-2"}
      data-testid="relational-executive-strategic-synthesis-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">
        Synthèse exécutive stratégique — digests consolidés déterministes
      </p>
      <p className="mt-0.5 text-[9px] text-slate-500">supervision globale institutionnelle — pas génération IA libre</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ExecutiveStrategicSynthesisOverviewSurface synthesisScore={synthesisScore} resilienceStrength={resilienceStrength} />
        <ExecutiveStrategicSynthesisPressureSurface executiveExposure={executiveExposure} systemicPressure={systemicPressure} />
        <ExecutiveStrategicSynthesisPrioritySurface executiveUrgency={executiveUrgency} />
        <ExecutiveStrategicSynthesisDigestSurface digestCount={digestCount} />
        <ExecutiveStrategicSynthesisHistorySurface signalCount={signalCount} />
        <ExecutiveStrategicSynthesisSystemicSurface strategicAlignmentScore={strategicAlignmentScore} />
      </div>
    </section>
  );
}
