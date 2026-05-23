"use client";

import type {
  RelationalEconomicCommandCenterOverviewDto,
  RelationalEconomicCommandCenterClusterListDto,
  RelationalEconomicCriticalCorridorListDto,
  RelationalEconomicCommandCenterSnapshotDto,
  RelationalEconomicSystemicViewDto,
} from "@venext/shared-contracts";

import {
  archiveSnapshot,
  fetchClusterPressure,
  fetchCommandOverview,
  fetchCriticalCorridors,
  fetchSnapshots,
  fetchSystemicView,
} from "./command-api";
import { ClusterPressureSurface } from "./surfaces/ClusterPressureSurface";
import { CriticalCorridorsSurface } from "./surfaces/CriticalCorridorsSurface";
import { PropagationHeatSurface } from "./surfaces/PropagationHeatSurface";
import { RealtimeStrip } from "./surfaces/RealtimeStrip";
import { StrategicPressureSurface } from "./surfaces/StrategicPressureSurface";
import { SystemicOverviewSurface } from "./surfaces/SystemicOverviewSurface";

import { useCallback, useEffect, useState } from "react";

export function RelationalEconomicCommandCenterPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  commandEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeLabel?: string | null;
  embedded?: boolean;
}) {
  const {
    organizationId,
    relationshipId,
    commandEnabled,
    realtimeEnabled,
    lastRealtimeLabel = null,
    embedded = false,
  } = props;

  const [busyId, setBusyId] = useState<string | null>(null);

  type LoadState = {
    overview: RelationalEconomicCommandCenterOverviewDto | null;
    systemic: RelationalEconomicSystemicViewDto | null;
    critical: RelationalEconomicCriticalCorridorListDto | null;
    snapshots: RelationalEconomicCommandCenterSnapshotDto[];
    clusters: RelationalEconomicCommandCenterClusterListDto | null;
  };

  const [data, setData] = useState<LoadState>({
    overview: null,
    systemic: null,
    critical: null,
    snapshots: [],
    clusters: null,
  });

  const reload = useCallback(async () => {
    if (!organizationId || !commandEnabled) return;
    const [ov, sys, crit, snaps, cls] = await Promise.all([
      fetchCommandOverview(organizationId),
      fetchSystemicView(organizationId, relationshipId ?? undefined),
      fetchCriticalCorridors(organizationId),
      fetchSnapshots(organizationId, relationshipId ?? undefined),
      fetchClusterPressure(organizationId, relationshipId ?? undefined),
    ]);
    setData({
      overview: ov.ok ? ov.data : null,
      systemic: sys.ok ? sys.data : null,
      critical: crit.ok ? crit.data : null,
      snapshots: snaps.ok ? snaps.data.snapshots : [],
      clusters: cls.ok ? cls.data : null,
    });
  }, [organizationId, relationshipId, commandEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onArchive = async (id: string) => {
    if (!organizationId) return;
    setBusyId(id);
    const res = await archiveSnapshot(
      organizationId,
      id,
      "Archivage snapshot supervision — historique conservé côté audit corridor.",
    );
    setBusyId(null);
    if (res.ok) void reload();
  };

  if (!commandEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="relational-command-center-disabled">
        Centre de commandement désactivé (<span className="font-mono">relational_economic_command_center_enabled</span>).
      </p>
    );
  }

  if (!organizationId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="relational-command-center-missing-org">
        Ajoutez <span className="font-mono">organizationId</span> pour la supervision économique relationnelle.
      </p>
    );
  }

  const hdr = embedded ? "rounded border border-violet-900/30 bg-violet-950/15 px-2 py-1.5" : "rounded border border-violet-900/40 bg-slate-950/90 px-3 py-2";

  return (
    <section
      className={embedded ? "space-y-2" : "rounded border border-violet-900/40 bg-slate-950/80 p-3"}
      data-testid={embedded ? undefined : "relational-economic-command-center-panel"}
    >
      <header className={hdr}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-violet-200/90">
          {embedded ? "Supervision agrégée" : "Centre commandement économique"}
        </p>
        {!embedded ? (
          <p className="mt-1 text-[9px] text-slate-500">
            Salle corridor multi-signaux — agrégats déterministes, audit-ready — pas cockpit pilotage automatique ni suivi acheteurs.
          </p>
        ) : null}
      </header>

      <div className={embedded ? "space-y-2 px-0" : "mt-3 space-y-3"}>
        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
          <SystemicOverviewSurface overview={data.overview} systemic={data.systemic} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
            <p className="mb-2 text-[9px] font-medium text-slate-400">Corridors critiques</p>
            <CriticalCorridorsSurface data={data.critical} />
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
            <p className="mb-2 text-[9px] font-medium text-slate-400">Pression clusters</p>
            <ClusterPressureSurface clusters={data.clusters} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <PropagationHeatSurface systemic={data.systemic} />
          <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
            <StrategicPressureSurface systemic={data.systemic} />
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[9px] font-medium text-slate-400">Instantanés systémiques (non destructifs)</p>
          <ul className="mt-2 space-y-1 font-mono text-[8px] text-slate-400">
            {data.snapshots.slice(0, 8).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {s.snapshotCode} · sévérité {s.severity} · risque {s.globalRiskScore}
                </span>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => void onArchive(s.id)}
                  className="rounded border border-violet-800/60 px-1.5 py-0.5 text-[8px] text-violet-200 hover:border-violet-500 disabled:opacity-40"
                >
                  Archiver
                </button>
              </li>
            ))}
          </ul>
          {!data.snapshots.length ? <p className="text-[8px] text-slate-600">Aucun snapshot actif listé pour ce périmètre.</p> : null}
        </div>

        <RealtimeStrip realtimeEnabled={realtimeEnabled} lastRealtimeLabel={lastRealtimeLabel} />
      </div>
    </section>
  );
}
