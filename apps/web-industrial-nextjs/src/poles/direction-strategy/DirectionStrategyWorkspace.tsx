"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { STRATEGIC_DEMO_ORGANIZATION_ID } from "./constants";
import { StrategicRealtimeStrip } from "./StrategicRealtimeStrip";
import { useStrategicCommandData } from "./useStrategicCommandData";

const StrategicOverviewSurface = dynamic(
  () => import("./surfaces/StrategicOverviewSurface").then((m) => m.StrategicOverviewSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const EconomicSignalRadar = dynamic(
  () => import("./surfaces/EconomicSignalRadar").then((m) => m.EconomicSignalRadar),
  { loading: () => <VenextPanelSkeleton /> },
);
const DistributionNetworkSurface = dynamic(
  () => import("./surfaces/DistributionNetworkSurface").then((m) => m.DistributionNetworkSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const MarketPressureSurface = dynamic(
  () => import("./surfaces/MarketPressureSurface").then((m) => m.MarketPressureSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const TerritoryOpportunityMap = dynamic(
  () => import("./surfaces/TerritoryOpportunityMap").then((m) => m.TerritoryOpportunityMap),
  { loading: () => <VenextPanelSkeleton tall /> },
);
const StrategicRiskMatrix = dynamic(
  () => import("./surfaces/StrategicRiskMatrix").then((m) => m.StrategicRiskMatrix),
  { loading: () => <VenextPanelSkeleton /> },
);
const AiStrategicBriefingPanel = dynamic(
  () => import("./surfaces/AiStrategicBriefingPanel").then((m) => m.AiStrategicBriefingPanel),
  { loading: () => <VenextPanelSkeleton /> },
);
const ExecutiveDecisionQueue = dynamic(
  () => import("./surfaces/ExecutiveDecisionQueue").then((m) => m.ExecutiveDecisionQueue),
  { loading: () => <VenextPanelSkeleton /> },
);
const CrossPoleIntelligenceSurface = dynamic(
  () => import("./surfaces/CrossPoleIntelligenceSurface").then((m) => m.CrossPoleIntelligenceSurface),
  { loading: () => <VenextPanelSkeleton /> },
);


type Props = {
  realtimeGateway: PoleRealtimeGateway;
};

export function DirectionStrategyWorkspace({ realtimeGateway }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth } = useAdaptiveQualityMode();
  const enabled = flags.strategic_intelligence_enabled !== false;
  const { bundle, loading, hydratedVia } = useStrategicCommandData(STRATEGIC_DEMO_ORGANIZATION_ID, enabled && hydrated);

  const latestSignal = useMemo(() => realtimeGateway.stream[0], [realtimeGateway.stream]);
  const rtEnabled = flags.realtime_signals_enabled !== false;

  if (!hydrated) {
    return <p className="px-2 text-xs text-slate-500">Hydrating industrial policies…</p>;
  }

  if (!enabled) {
    return (
      <div className="m-2 rounded border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-400">
        Direction / Strategy command center disabled by{" "}
        <span className="font-mono text-cyan-200/80">strategic_intelligence_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="border-b border-slate-800/90 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-amber-200/80">Direction · Strategy</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">Strategic intelligence cockpit</h2>
        <p className="max-w-3xl text-xs text-slate-500">
          Economic interpretation center — correlates internal signals with declared external overlays. Demo scope:{" "}
          <span className="font-mono text-slate-400">{STRATEGIC_DEMO_ORGANIZATION_ID}</span>
        </p>
        {loading ? <p className="mt-2 text-[11px] text-slate-500">Progressive hydration — intelligence strips loading…</p> : null}
        {!loading && hydratedVia ? (
          <p className="mt-1 text-[10px] text-slate-600">
            Payload: {hydratedVia === "bundle" ? "strategic bundle (single request)" : "parallel endpoints (fallback)"}
          </p>
        ) : null}
      </div>

      {rtEnabled ? (
        <StrategicRealtimeStrip
          connected={realtimeGateway.connected}
          demoMode={realtimeGateway.demoMode}
          liveChannel={realtimeGateway.liveChannel}
          latest={latestSignal}
        />
      ) : (
        <p className="mx-2 text-[10px] text-slate-600">
          Realtime channel idle — <span className="font-mono">realtime_signals_enabled</span> off (same rule as pole canvas).
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-1">
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <StrategicOverviewSurface data={bundle.overview} />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <CrossPoleIntelligenceSurface data={bundle.overview} />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <EconomicSignalRadar data={bundle.signals} />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <DistributionNetworkSurface data={bundle.distribution} />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <MarketPressureSurface data={bundle.marketPressure} />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <TerritoryOpportunityMap
            organizationId={STRATEGIC_DEMO_ORGANIZATION_ID}
            data={bundle.territory}
            lowPower={lowBandwidth}
            mapEnabled={flags.territory_map_enabled !== false}
          />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <StrategicRiskMatrix data={bundle.risk} />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <AiStrategicBriefingPanel data={bundle.briefing} />
        </div>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/40 p-3">
          <ExecutiveDecisionQueue data={bundle.executiveQueue} />
        </div>
      </div>
    </div>
  );
}
