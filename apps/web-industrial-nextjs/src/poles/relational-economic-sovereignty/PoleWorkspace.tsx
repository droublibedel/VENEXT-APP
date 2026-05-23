"use client";

import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";

import { useCallback, useEffect, useState } from "react";

import { RelationalEconomicSovereigntyPanel } from "./RelationalEconomicSovereigntyPanel";
import {
  fetchAutonomyDistribution,
  fetchDependencyConcentration,
  fetchSovereigntyDashboard,
  fetchSystemicCaptivity,
} from "./sovereignty-api";
import {
  AutonomyDistributionSurface,
  CaptivityDistributionSurface,
  DependencyConcentrationSurface,
  SovereigntyDashboardSurface,
  SystemicExposureSurface,
} from "./sovereignty-surfaces";

const SLUG = "relational-economic-sovereignty" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const params = useSearchParams();
  const relationshipId = params.get("relationshipId");
  const organizationId = params.get("organizationId") ?? org.organizationId;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();

  const sovereigntyEnabled = hydrated && flags.relational_economic_sovereignty_enabled !== false;
  const realtimeEnabled = hydrated && flags.relational_economic_sovereignty_realtime_enabled !== false;

  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    sovereigntyEnabled &&
    Boolean(entry);

  const [dash, setDash] = useState<{
    corridorCount: number;
    aggregateSovereigntyScore: number;
    aggregateAutonomyScore: number;
    calibrationProfile: string;
  } | null>(null);
  const [captiveCount, setCaptiveCount] = useState(0);
  const [autonomyDist, setAutonomyDist] = useState<{ sampleSize: number; fallback: number } | null>(null);
  const [depConc, setDepConc] = useState<{ mean: number; ext: number; territories: number; sectors: number } | null>(
    null,
  );

  const reloadDashboard = useCallback(async () => {
    if (!organizationId || !sovereigntyEnabled) {
      setDash(null);
      setCaptiveCount(0);
      setAutonomyDist(null);
      setDepConc(null);
      return;
    }
    const [d, c, a, dc] = await Promise.all([
      fetchSovereigntyDashboard(organizationId),
      fetchSystemicCaptivity(organizationId),
      fetchAutonomyDistribution(organizationId),
      fetchDependencyConcentration(organizationId),
    ]);
    if (d.ok && typeof d.data === "object" && d.data) {
      const x = d.data as Record<string, unknown>;
      setDash({
        corridorCount: Number(x.corridorCount ?? 0),
        aggregateSovereigntyScore: Number(x.aggregateSovereigntyScore ?? 0),
        aggregateAutonomyScore: Number(x.aggregateAutonomyScore ?? 0),
        calibrationProfile: String(x.calibrationProfile ?? "BALANCED"),
      });
    } else setDash(null);
    if (c.ok && typeof c.data === "object" && c.data && Array.isArray((c.data as { captiveCorridors: unknown }).captiveCorridors)) {
      setCaptiveCount((c.data as { captiveCorridors: unknown[] }).captiveCorridors.length);
    } else setCaptiveCount(0);
    if (a.ok && typeof a.data === "object" && a.data) {
      const x = a.data as Record<string, unknown>;
      setAutonomyDist({
        sampleSize: Number(x.sampleSize ?? 0),
        fallback: Number(x.heuristicFallbackCorridors ?? 0),
      });
    } else setAutonomyDist(null);
    if (dc.ok && typeof dc.data === "object" && dc.data) {
      const x = dc.data as Record<string, unknown>;
      const terr = x.systemicExposureByTerritory;
      const sec = x.systemicExposureBySector;
      setDepConc({
        mean: Number(x.meanDependencyConcentration ?? 0),
        ext: Number(x.meanExternalDependencyExposure ?? 0),
        territories: terr && typeof terr === "object" ? Object.keys(terr).length : 0,
        sectors: sec && typeof sec === "object" ? Object.keys(sec).length : 0,
      });
    } else setDepConc(null);
  }, [organizationId, sovereigntyEnabled]);

  useEffect(() => {
    void reloadDashboard();
  }, [reloadDashboard]);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled && realtimeEnabled,
    subscribeOrganizationId: organizationId ?? undefined,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  return (
    <div className="flex min-h-0 flex-col gap-3 px-3 py-3">
      <header className="rounded border border-slate-700/50 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200/90">
          {entry?.title ?? "Economic sovereignty"}
        </p>
        <p className="mt-1 text-[10px] text-slate-400/70">{entry?.subtitle}</p>
      </header>
      {sovereigntyEnabled && dash ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <SovereigntyDashboardSurface
            corridorCount={dash.corridorCount}
            aggregateSovereignty={dash.aggregateSovereigntyScore}
            aggregateAutonomy={dash.aggregateAutonomyScore}
            calibrationProfile={dash.calibrationProfile}
          />
          <CaptivityDistributionSurface captiveCount={captiveCount} />
          {autonomyDist ? (
            <AutonomyDistributionSurface
              sampleSize={autonomyDist.sampleSize}
              fallbackCorridors={autonomyDist.fallback}
              confidenceLabel="MEDIUM"
            />
          ) : null}
          {depConc ? (
            <DependencyConcentrationSurface meanConcentration={depConc.mean} meanExternal={depConc.ext} />
          ) : null}
          {depConc ? (
            <SystemicExposureSurface territoryKeys={depConc.territories} sectorKeys={depConc.sectors} />
          ) : null}
        </div>
      ) : null}
      <RelationalEconomicSovereigntyPanel
        organizationId={organizationId}
        relationshipId={relationshipId}
        sovereigntyEnabled={sovereigntyEnabled}
        realtimeEnabled={realtimeEnabled}
        realtimeGateway={gatewayEnabled && realtimeEnabled ? realtimeGateway : null}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
