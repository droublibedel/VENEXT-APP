"use client";

import type {
  DependencyMapOverviewDto,
  MarketStructureOverviewDto,
  SectorExpansionOpportunitiesDto,
  SectorOverviewDto,
  SectorPressureOverviewDto,
  SectorPropagationMapDto,
  SystemicSectorRiskDto,
} from "@venext/shared-contracts";
import { OverviewSchema } from "@venext/shared-contracts";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import {
  fetchSectorDependencyMap,
  fetchSectorExpansionOpportunities,
  fetchSectorMarketStructure,
  fetchSectorOverview,
  fetchSectorPressureZones,
  fetchSectorPropagationMap,
  fetchSectorSystemicRisk,
} from "./sector-api";
import { findLatestSectorSignalForRelationship, sectorEnvelopeToRefetchScopes } from "./sector-stream-bridge";
import { DependencySurface } from "./surfaces/DependencySurface";
import { ExpansionSurface } from "./surfaces/ExpansionSurface";
import { MarketStructureSurface } from "./surfaces/MarketStructureSurface";
import { PressureSurface } from "./surfaces/PressureSurface";
import { PropagationSurface } from "./surfaces/PropagationSurface";
import { RealtimeStrip } from "./surfaces/RealtimeStrip";
import { SectorOverviewSurface } from "./surfaces/SectorOverviewSurface";
import { SystemicRiskSurface } from "./surfaces/SystemicRiskSurface";

function streamDedupKey(envelope: string, item: { id: string; relationalSectorRealtimePayload?: unknown }): string {
  const p = item.relationalSectorRealtimePayload as { eventId?: string } | undefined;
  if (p?.eventId) return `${envelope}:${p.eventId}`;
  return `${envelope}:${item.id}`;
}

export function RelationalSectorIntelligencePanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  sectorEnabled: boolean;
  realtimeEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const {
    organizationId,
    relationshipId,
    sectorEnabled,
    realtimeEnabled,
    realtimeGateway = null,
    embedded = false,
  } = props;

  const [overview, setOverview] = useState<SectorOverviewDto | null>(null);
  const [market, setMarket] = useState<MarketStructureOverviewDto | null>(null);
  const [propagation, setPropagation] = useState<SectorPropagationMapDto | null>(null);
  const [pressure, setPressure] = useState<SectorPressureOverviewDto | null>(null);
  const [expansion, setExpansion] = useState<SectorExpansionOpportunitiesDto | null>(null);
  const [dependency, setDependency] = useState<DependencyMapOverviewDto | null>(null);
  const [systemic, setSystemic] = useState<SystemicSectorRiskDto | null>(null);
  const [lastLocalRefresh, setLastLocalRefresh] = useState<string | null>(null);
  const [lastEventLabel, setLastEventLabel] = useState<string | null>(null);
  const lastDedupKey = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    if (!organizationId || !sectorEnabled || !relationshipId) {
      setOverview(null);
      setMarket(null);
      setPropagation(null);
      setPressure(null);
      setExpansion(null);
      setDependency(null);
      setSystemic(null);
      return;
    }
    const [
      ovR,
      msR,
      prR,
      pzR,
      exR,
      depR,
      sysR,
    ] = await Promise.all([
      fetchSectorOverview(organizationId, relationshipId),
      fetchSectorMarketStructure(organizationId, relationshipId),
      fetchSectorPropagationMap(organizationId, relationshipId),
      fetchSectorPressureZones(organizationId, relationshipId),
      fetchSectorExpansionOpportunities(organizationId, relationshipId),
      fetchSectorDependencyMap(organizationId, relationshipId),
      fetchSectorSystemicRisk(organizationId, relationshipId),
    ]);
    if (ovR.ok) {
      const p = OverviewSchema.safeParse(ovR.data);
      setOverview(p.success ? p.data : null);
    } else setOverview(null);
    setMarket(msR.ok ? (msR.data as MarketStructureOverviewDto) : null);
    setPropagation(prR.ok ? (prR.data as SectorPropagationMapDto) : null);
    setPressure(pzR.ok ? (pzR.data as SectorPressureOverviewDto) : null);
    setExpansion(exR.ok ? (exR.data as SectorExpansionOpportunitiesDto) : null);
    setDependency(depR.ok ? (depR.data as DependencyMapOverviewDto) : null);
    setSystemic(sysR.ok ? (sysR.data as SystemicSectorRiskDto) : null);
    setLastLocalRefresh(new Date().toISOString());
  }, [organizationId, relationshipId, sectorEnabled]);

  const applyScopes = useCallback(
    async (scopes: Set<string>) => {
      if (!organizationId || !relationshipId) return;
      const tasks: Promise<void>[] = [];
      if (scopes.has("overview")) {
        tasks.push(
          (async () => {
            const ovR = await fetchSectorOverview(organizationId, relationshipId);
            if (ovR.ok) {
              const p = OverviewSchema.safeParse(ovR.data);
              if (p.success) setOverview(p.data);
            }
          })(),
        );
      }
      if (scopes.has("market")) {
        tasks.push(
          (async () => {
            const msR = await fetchSectorMarketStructure(organizationId, relationshipId);
            if (msR.ok) setMarket(msR.data as MarketStructureOverviewDto);
          })(),
        );
      }
      if (scopes.has("propagation")) {
        tasks.push(
          (async () => {
            const prR = await fetchSectorPropagationMap(organizationId, relationshipId);
            if (prR.ok) setPropagation(prR.data as SectorPropagationMapDto);
          })(),
        );
      }
      if (scopes.has("pressure")) {
        tasks.push(
          (async () => {
            const pzR = await fetchSectorPressureZones(organizationId, relationshipId);
            if (pzR.ok) setPressure(pzR.data as SectorPressureOverviewDto);
          })(),
        );
      }
      if (scopes.has("expansion")) {
        tasks.push(
          (async () => {
            const exR = await fetchSectorExpansionOpportunities(organizationId, relationshipId);
            if (exR.ok) setExpansion(exR.data as SectorExpansionOpportunitiesDto);
          })(),
        );
      }
      if (scopes.has("dependency")) {
        tasks.push(
          (async () => {
            const depR = await fetchSectorDependencyMap(organizationId, relationshipId);
            if (depR.ok) setDependency(depR.data as DependencyMapOverviewDto);
          })(),
        );
      }
      if (scopes.has("systemic")) {
        tasks.push(
          (async () => {
            const sysR = await fetchSectorSystemicRisk(organizationId, relationshipId);
            if (sysR.ok) setSystemic(sysR.data as SystemicSectorRiskDto);
          })(),
        );
      }
      await Promise.all(tasks);
      setLastLocalRefresh(new Date().toISOString());
    },
    [organizationId, relationshipId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway || !relationshipId || !realtimeEnabled) return;
    const hit = findLatestSectorSignalForRelationship(realtimeGateway.stream, relationshipId);
    if (!hit) return;
    const dk = streamDedupKey(hit.envelope, hit.item);
    if (dk === lastDedupKey.current) return;
    lastDedupKey.current = dk;
    setLastEventLabel(hit.envelope);
    const scopes = sectorEnvelopeToRefetchScopes(hit.envelope);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void applyScopes(scopes);
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [applyScopes, realtimeEnabled, realtimeGateway, relationshipId]);

  if (!sectorEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="relational-sector-intelligence-disabled">
        Intelligence sectorielle désactivée (<span className="font-mono">relational_sector_intelligence_enabled</span>).
      </p>
    );
  }

  if (!organizationId) {
    return (
      <p className="text-[9px] text-slate-500">
        Ajoutez <span className="font-mono">organizationId</span> pour la lecture sectorielle corridor.
      </p>
    );
  }

  if (!relationshipId) {
    return (
      <p className="text-[9px] text-amber-100/55">
        Sélectionnez un corridor (<span className="font-mono">relationshipId</span>) pour matérialiser la structure de
        marché.
      </p>
    );
  }

  const hdr = embedded
    ? "rounded border border-amber-900/40 bg-amber-950/30 px-2 py-1.5"
    : "rounded border border-amber-800/50 bg-slate-950/90 px-3 py-2";

  const syncMode: "live" | "fallback" = realtimeGateway?.connected ? "live" : "fallback";

  return (
    <section
      className={embedded ? "space-y-2" : "rounded border border-amber-800/50 bg-slate-950/80 p-3"}
      data-testid={embedded ? undefined : "relational-sector-intelligence-panel"}
    >
      <header className={hdr}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
          Intelligence sectorielle & structure de marché
        </p>
        <p className="mt-1 text-[9px] text-amber-100/65">
          Infrastructure d’observation — concentrations, propagation bornée, déséquilibres territoire ↔ secteur — pas
          cockpit financier ni moteur marketplace.
        </p>
      </header>
      <RealtimeStrip
        enabled={realtimeEnabled}
        syncMode={syncMode}
        lastLabel={lastEventLabel}
        lastUpdatedAt={lastLocalRefresh}
      />
      <div className="grid gap-2 md:grid-cols-2">
        <SectorOverviewSurface overview={overview} />
        <MarketStructureSurface data={market} />
        <PropagationSurface data={propagation} />
        <ExpansionSurface data={expansion} />
        <PressureSurface data={pressure} />
        <DependencySurface data={dependency} />
        <SystemicRiskSurface data={systemic} />
      </div>
    </section>
  );
}
