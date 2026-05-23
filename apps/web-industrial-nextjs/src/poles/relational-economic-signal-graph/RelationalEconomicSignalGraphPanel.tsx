"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  RelationalEconomicClusterListDto,
  RelationalEconomicGraphOverviewDto,
  RelationalEconomicPropagationDto,
  RelationalEconomicSignalListDto,
  RelationalEconomicSignalNodeDto,
} from "@venext/shared-contracts";

import { archiveSignal, fetchClusters, fetchGraphOverview, fetchPropagation, fetchSignals } from "./graph-api";
import { ClusterSurface } from "./surfaces/ClusterSurface";
import { DependencySurface } from "./surfaces/DependencySurface";
import { EconomicRealtimeStrip } from "./surfaces/EconomicRealtimeStrip";
import { GraphOverviewSurface } from "./surfaces/GraphOverviewSurface";
import { PropagationSurface } from "./surfaces/PropagationSurface";

export function RelationalEconomicSignalGraphPanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  graphEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeEvent?: string | null;
}) {
  const { organizationId, relationshipId, graphEnabled, realtimeEnabled, lastRealtimeEvent } = props;
  const [list, setList] = useState<RelationalEconomicSignalListDto | null>(null);
  const [overview, setOverview] = useState<RelationalEconomicGraphOverviewDto | null>(null);
  const [propagation, setPropagation] = useState<RelationalEconomicPropagationDto | null>(null);
  const [clusters, setClusters] = useState<RelationalEconomicClusterListDto | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !graphEnabled) return;
    void fetchSignals(organizationId, relationshipId).then((r) => {
      if (r.ok) setList(r.data);
    });
    void fetchGraphOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setOverview(r.data);
    });
    void fetchPropagation(organizationId, relationshipId).then((r) => {
      if (r.ok) setPropagation(r.data);
    });
    void fetchClusters(organizationId, relationshipId).then((r) => {
      if (r.ok) setClusters(r.data);
    });
  }, [organizationId, relationshipId, graphEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const selected: RelationalEconomicSignalNodeDto | null = useMemo(() => {
    if (!list) return null;
    if (!selectedId) return list.signals[0] ?? null;
    return list.signals.find((s) => s.id === selectedId) ?? list.signals[0] ?? null;
  }, [list, selectedId]);

  useEffect(() => {
    if (list?.signals.length && !selectedId) setSelectedId(list.signals[0]!.id);
  }, [list, selectedId]);

  if (!graphEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="economic-signal-graph-disabled">
        Graphe signaux économiques désactivé (
        <span className="font-mono">relational_economic_signal_graph_enabled</span>).
      </p>
    );
  }

  if (!relationshipId || !organizationId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="economic-signal-graph-missing-relationship">
        Corridor requis pour le graphe de signaux économiques.
      </p>
    );
  }

  const onArchive = async () => {
    if (!selected || !organizationId) return;
    setBusy(true);
    const res = await archiveSignal(
      organizationId,
      selected.id,
      "Archivage manuel corridor — signal économique obsolète.",
    );
    setBusy(false);
    if (res.ok) reload();
  };

  return (
    <section
      className="rounded border border-amber-900/40 bg-slate-950/80 p-3"
      data-testid="relational-economic-signal-graph-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
        Graphe signaux économiques
      </p>
      <p className="mt-1 text-[9px] text-slate-500">
        Corrélation inter-corridors, propagation et clusters opérationnels — graphe de dépendances corridor explicable.
      </p>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/70 p-3">
        <GraphOverviewSurface overview={overview} />
      </div>

      {list && list.signals.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {list.signals.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`rounded border px-2 py-0.5 text-[8px] font-mono ${
                selected?.id === s.id
                  ? "border-amber-700/60 bg-amber-950/40 text-amber-200"
                  : "border-slate-800 text-slate-500"
              }`}
            >
              {s.nodeCode.slice(0, 16)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[9px] font-medium text-slate-400">Propagation</p>
          <PropagationSurface propagation={propagation} />
        </div>
        <div className="rounded border border-amber-900/30 bg-amber-950/10 p-3">
          <p className="text-[9px] font-medium text-slate-400">Clusters</p>
          <ClusterSurface clusters={clusters} />
        </div>
      </div>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-[9px] font-medium text-slate-400">Dépendances (arêtes)</p>
        <DependencySurface edges={list?.edges ?? []} />
      </div>

      {selected ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-[8px] font-mono text-slate-500">
            {selected.severity} · {selected.propagationRisk} · fragilité {selected.operationalFragilityScore}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onArchive()}
            className="rounded border border-slate-700 px-2 py-0.5 text-[8px] text-slate-400 hover:border-amber-800"
          >
            Archiver signal
          </button>
        </div>
      ) : null}

      <div className="mt-2">
        <EconomicRealtimeStrip realtimeEnabled={realtimeEnabled} lastRealtimeEvent={lastRealtimeEvent} />
      </div>
    </section>
  );
}
