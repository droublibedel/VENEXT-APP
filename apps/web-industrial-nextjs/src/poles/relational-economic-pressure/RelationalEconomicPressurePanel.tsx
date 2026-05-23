"use client";

import type {
  CriticalCorridorDto,
  DependencyMapDto,
  FragilityZonesDto,
  PressureOverviewDto,
  PropagationMapDto,
} from "@venext/shared-contracts";
import { useCallback, useEffect, useState } from "react";

import {
  fetchCriticalCorridorsPressure,
  fetchDependencyMap,
  fetchFragilityZones,
  fetchPressureOverview,
  fetchPropagationMapPressure,
} from "./pressure-api";
import { ContagionSurface } from "./surfaces/ContagionSurface";
import { CriticalCorridorsSurface } from "./surfaces/CriticalCorridorsSurface";
import { DependencyMapSurface } from "./surfaces/DependencyMapSurface";
import { FragilitySurface } from "./surfaces/FragilitySurface";
import { PressureOverviewSurface } from "./surfaces/PressureOverviewSurface";
import { RealtimeStrip } from "./surfaces/RealtimeStrip";

export function RelationalEconomicPressurePanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  pressureEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeLabel?: string | null;
  embedded?: boolean;
}) {
  const {
    organizationId,
    relationshipId,
    pressureEnabled,
    realtimeEnabled,
    lastRealtimeLabel = null,
    embedded = false,
  } = props;

  const [overview, setOverview] = useState<PressureOverviewDto | null>(null);
  const [map, setMap] = useState<DependencyMapDto | null>(null);
  const [propagation, setPropagation] = useState<PropagationMapDto | null>(null);
  const [critical, setCritical] = useState<{ corridors: CriticalCorridorDto[] } | null>(null);
  const [fragility, setFragility] = useState<FragilityZonesDto | null>(null);

  const reload = useCallback(async () => {
    if (!organizationId || !pressureEnabled) return;
    const [crit, frag] = await Promise.all([
      fetchCriticalCorridorsPressure(organizationId),
      fetchFragilityZones(organizationId),
    ]);
    setCritical(crit.ok ? crit.data : null);
    setFragility(frag.ok ? frag.data : null);
    if (!relationshipId) {
      setOverview(null);
      setMap(null);
      setPropagation(null);
      return;
    }
    const [ov, dep, prop] = await Promise.all([
      fetchPressureOverview(organizationId, relationshipId),
      fetchDependencyMap(organizationId, relationshipId),
      fetchPropagationMapPressure(organizationId, relationshipId),
    ]);
    setOverview(ov.ok ? ov.data : null);
    setMap(dep.ok ? dep.data : null);
    setPropagation(prop.ok ? prop.data : null);
  }, [organizationId, relationshipId, pressureEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!pressureEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="relational-economic-pressure-disabled">
        Cartographie pression désactivée (<span className="font-mono">relational_economic_pressure_enabled</span>).
      </p>
    );
  }

  if (!organizationId) {
    return (
      <p className="text-[9px] text-slate-500">
        Ajoutez <span className="font-mono">organizationId</span> pour la cartographie pression corridor.
      </p>
    );
  }

  const hdr = embedded ? "rounded border border-orange-900/35 bg-orange-950/20 px-2 py-1.5" : "rounded border border-orange-900/45 bg-slate-950/90 px-3 py-2";

  return (
    <section
      className={embedded ? "space-y-2" : "rounded border border-orange-900/45 bg-slate-950/80 p-3"}
      data-testid={embedded ? undefined : "relational-economic-pressure-panel"}
    >
      <header className={hdr}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-orange-200/90">
          {embedded ? "Pression & dépendances" : "Cartographie pression économique"}
        </p>
        {!embedded ? (
          <p className="mt-1 text-[9px] text-slate-500">
            Intelligence corridor systémique — pas tableau logistique, pas suivi colis, pas scoring public.
          </p>
        ) : null}
      </header>

      <div className={embedded ? "space-y-2" : "mt-3 space-y-3"}>
        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
          <PressureOverviewSurface overview={overview} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
            <p className="mb-1 text-[9px] font-medium text-slate-400">Carte dépendances</p>
            <DependencyMapSurface map={map} />
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
            <p className="mb-1 text-[9px] font-medium text-slate-400">Contagion corridor</p>
            <ContagionSurface map={propagation} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
            <p className="mb-1 text-[9px] font-medium text-slate-400">Corridors critiques (org)</p>
            <CriticalCorridorsSurface corridors={critical?.corridors ?? []} />
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
            <p className="mb-1 text-[9px] font-medium text-slate-400">Zones fragilité</p>
            <FragilitySurface zones={fragility} />
          </div>
        </div>
        <RealtimeStrip realtimeEnabled={realtimeEnabled} lastRealtimeLabel={lastRealtimeLabel} />
      </div>
    </section>
  );
}
