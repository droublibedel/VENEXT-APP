"use client";

import type {
  GeoEconomicClusterDto,
  GeoEconomicCriticalZonesDto,
  GeoEconomicExpansionOverviewDto,
  GeoEconomicOverviewDto,
  GeoEconomicPressureDto,
  GeoEconomicPropagationDto,
  GeoEconomicZoneDto,
} from "@venext/shared-contracts";
import { GeoEconomicClusterSchema, GeoEconomicOverviewSchema } from "@venext/shared-contracts";
import { useCallback, useEffect, useState } from "react";

import {
  fetchGeoCriticalZones,
  fetchGeoExpansionOverview,
  fetchGeoPressureMap,
  fetchGeoPropagationMap,
  fetchGeoZones,
} from "./geo-api";
import { CriticalZonesSurface } from "./surfaces/CriticalZonesSurface";
import { ClusterSurface } from "./surfaces/ClusterSurface";
import { ExpansionSurface } from "./surfaces/ExpansionSurface";
import { GeoEconomicOverviewSurface } from "./surfaces/GeoEconomicOverviewSurface";
import { PressureMapSurface } from "./surfaces/PressureMapSurface";
import { PropagationSurface } from "./surfaces/PropagationSurface";
import { RealtimeStrip } from "./surfaces/RealtimeStrip";

function buildOverview(organizationId: string, zones: GeoEconomicZoneDto[]): GeoEconomicOverviewDto | null {
  const zoneCount = zones.length;
  const averagePressureScore =
    zoneCount === 0 ? 0 : Math.round(zones.reduce((s, z) => s + z.economicPressureScore, 0) / zoneCount);
  const averageDensityScore =
    zoneCount === 0 ? 0 : Math.round(zones.reduce((s, z) => s + z.operationalDensityScore, 0) / zoneCount);
  const top = zones[0];
  const dominantTerritorialNarrative = top
    ? `Bassin prioritaire observé: ${top.zoneName} (pression ${top.economicPressureScore}, densité ${top.operationalDensityScore}).`
    : "Aucun bassin territorial indexé pour cette organisation.";
  const raw = {
    organizationId,
    zoneCount,
    averagePressureScore,
    averageDensityScore,
    dominantTerritorialNarrative: dominantTerritorialNarrative.slice(0, 800),
    zones: zones.slice(0, 80),
    computedAt: new Date().toISOString(),
    paymentExecutionDisabled: true as const,
    publicTrackingDisabled: true as const,
  };
  const p = GeoEconomicOverviewSchema.safeParse(raw);
  return p.success ? p.data : null;
}

function buildClusters(zones: GeoEconomicZoneDto[]): GeoEconomicClusterDto[] {
  const by = new Map<string, string[]>();
  for (const z of zones) {
    const arr = by.get(z.countryCode) ?? [];
    arr.push(z.zoneCode);
    by.set(z.countryCode, arr);
  }
  const raw = [...by.entries()].slice(0, 6).map(([country, zoneCodes]) => ({
    clusterCode: `CLUSTER:${country}`.slice(0, 160),
    zoneCodes: zoneCodes.slice(0, 24),
    clusterIntensity: Math.min(100, zoneCodes.length * 22 + 8),
    narrative: `Lecture agrégée des bassins indexés pour le territoire ${country} (${zoneCodes.length} noeuds).`.slice(
      0,
      800,
    ),
    paymentExecutionDisabled: true as const,
    publicTrackingDisabled: true as const,
  }));
  return raw
    .map((r) => {
      const p = GeoEconomicClusterSchema.safeParse(r);
      return p.success ? p.data : null;
    })
    .filter((x): x is GeoEconomicClusterDto => x != null);
}

export function RelationalGeoEconomicPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  geoEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeLabel?: string | null;
  embedded?: boolean;
}) {
  const {
    organizationId,
    relationshipId,
    geoEnabled,
    realtimeEnabled,
    lastRealtimeLabel = null,
    embedded = false,
  } = props;

  const [overview, setOverview] = useState<GeoEconomicOverviewDto | null>(null);
  const [pressure, setPressure] = useState<GeoEconomicPressureDto | null>(null);
  const [expansion, setExpansion] = useState<GeoEconomicExpansionOverviewDto | null>(null);
  const [critical, setCritical] = useState<GeoEconomicCriticalZonesDto | null>(null);
  const [propagation, setPropagation] = useState<GeoEconomicPropagationDto | null>(null);
  const [clusters, setClusters] = useState<GeoEconomicClusterDto[]>([]);

  const reload = useCallback(async () => {
    if (!organizationId || !geoEnabled) return;
    const [zonesR, pressureR, expansionR, criticalR] = await Promise.all([
      fetchGeoZones(organizationId),
      fetchGeoPressureMap(organizationId),
      fetchGeoExpansionOverview(organizationId),
      fetchGeoCriticalZones(organizationId),
    ]);
    const zones = zonesR.ok ? zonesR.data.zones : [];
    setOverview(buildOverview(organizationId, zones));
    setClusters(buildClusters(zones));
    setPressure(pressureR.ok ? pressureR.data : null);
    setExpansion(expansionR.ok ? expansionR.data : null);
    setCritical(criticalR.ok ? criticalR.data : null);
    if (!relationshipId) {
      setPropagation(null);
      return;
    }
    const propR = await fetchGeoPropagationMap(organizationId, relationshipId);
    setPropagation(propR.ok ? propR.data : null);
  }, [organizationId, relationshipId, geoEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!geoEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="relational-geo-economic-disabled">
        Intelligence géo-économique désactivée (<span className="font-mono">relational_geo_economic_enabled</span>).
      </p>
    );
  }

  if (!organizationId) {
    return (
      <p className="text-[9px] text-slate-500">
        Ajoutez <span className="font-mono">organizationId</span> pour la lecture territoriale corridor.
      </p>
    );
  }

  const hdr = embedded
    ? "rounded border border-amber-900/40 bg-amber-950/25 px-2 py-1.5"
    : "rounded border border-amber-800/50 bg-slate-950/90 px-3 py-2";

  return (
    <section
      className={embedded ? "space-y-2" : "rounded border border-amber-800/50 bg-slate-950/80 p-3"}
      data-testid={embedded ? undefined : "relational-geo-economic-panel"}
    >
      <header className={hdr}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
          Intelligence géo-économique territoriale
        </p>
        <p className="mt-1 text-[9px] text-amber-100/65">
          Infrastructure analytique — concentrations régionales, propagation systémique, densité opérationnelle — pas GPS
          ni suivi livraison.
        </p>
      </header>
      <RealtimeStrip enabled={realtimeEnabled} lastLabel={lastRealtimeLabel} />
      <div className="grid gap-2 md:grid-cols-2">
        <GeoEconomicOverviewSurface overview={overview} />
        <PressureMapSurface pressure={pressure} />
        <PropagationSurface propagation={propagation} />
        <ExpansionSurface expansion={expansion} />
        <ClusterSurface clusters={clusters} />
        <CriticalZonesSurface critical={critical} />
      </div>
    </section>
  );
}
