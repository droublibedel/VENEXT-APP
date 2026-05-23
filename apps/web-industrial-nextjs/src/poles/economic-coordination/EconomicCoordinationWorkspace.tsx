"use client";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";

import { EconomicCoordinationRealtimeStrip } from "./EconomicCoordinationRealtimeStrip";
import {
  ConflictMatrixSurface,
  CoordinationOverviewSurface,
  EscalationPanelSurface,
  MemorySurface,
  OrchestrationQueueSurface,
  PostureSurface,
  PriorityLadderSurface,
} from "./EconomicCoordinationSurfaces";
import type { EconomicCoordinationOrgResolution } from "./resolveEconomicCoordinationOrganizationId";
import { loadEconomicCoordinationSlicesSequential } from "./economic-coordination-sequential-load";
import type { EconomicCoordinationRemoteData } from "./useEconomicCoordinationData";
import { useEffect, useState } from "react";

export function EconomicCoordinationWorkspace({
  organizationResolution,
  realtimeGateway,
  coordinationData,
}: {
  organizationResolution: EconomicCoordinationOrgResolution;
  realtimeGateway: PoleRealtimeGateway;
  coordinationData: EconomicCoordinationRemoteData;
}) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { bundle, loading, error } = coordinationData;
  const [seqNote, setSeqNote] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (bundle) return;
    if (!error) return;
    let cancelled = false;
    void loadEconomicCoordinationSlicesSequential(organizationResolution.organizationId).then((s) => {
      if (cancelled) return;
      const ok = Boolean(s.overview && s.posture);
      setSeqNote(
        ok
          ? "Sequential slices hydrated (overview+posture+…)."
          : "Chargement partiel des vues — certaines sections ne sont pas disponibles.",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [organizationResolution.organizationId, bundle, error, loading]);

  const enabled = flags.economic_coordination_enabled !== false && hydrated;

  if (!enabled) {
    return (
      <div className="m-4 rounded border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-300">
        Couche coordination désactivée par <span className="font-mono text-cyan-200/80">economic_coordination_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <EconomicCoordinationRealtimeStrip gateway={realtimeGateway} />
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
        org {organizationResolution.organizationId.slice(0, 8)}… · {organizationResolution.source}
        {loading ? " · chargement" : ""}
        {error ? ` · ${error}` : ""}
        {seqNote ? ` · ${seqNote}` : ""}
      </div>
      <CoordinationOverviewSurface bundle={bundle} />
      <PostureSurface bundle={bundle} />
      <ConflictMatrixSurface bundle={bundle} />
      <PriorityLadderSurface bundle={bundle} />
      <OrchestrationQueueSurface bundle={bundle} />
      <EscalationPanelSurface bundle={bundle} />
      <MemorySurface bundle={bundle} />
      <p className="text-[10px] text-slate-500">
        Moteur d’orchestration économique — coordinateur analytique. Aucune exécution automatique sur les systèmes métiers.
      </p>
    </div>
  );
}
