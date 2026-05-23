"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { COMMERCIAL_NETWORK_DEMO_ORGANIZATION_ID } from "./constants";
import { CommercialRealtimeStrip } from "./CommercialRealtimeStrip";
import { useCommercialNetworkData } from "./useCommercialNetworkData";

const CommercialNetworkOverview = dynamic(
  () => import("./surfaces/CommercialNetworkOverview").then((m) => m.CommercialNetworkOverview),
  { loading: () => <VenextPanelSkeleton /> },
);
const RelationshipIntelligenceSurface = dynamic(
  () => import("./surfaces/RelationshipIntelligenceSurface").then((m) => m.RelationshipIntelligenceSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const DistributorPerformanceObservatory = dynamic(
  () => import("./surfaces/DistributorPerformanceObservatory").then((m) => m.DistributorPerformanceObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const RetailerActivityRadar = dynamic(
  () => import("./surfaces/RetailerActivityRadar").then((m) => m.RetailerActivityRadar),
  { loading: () => <VenextPanelSkeleton /> },
);
const CommercialExpansionMap = dynamic(
  () => import("./surfaces/CommercialExpansionMap").then((m) => m.CommercialExpansionMap),
  { loading: () => <VenextPanelSkeleton tall /> },
);
const RelationshipStabilityMatrix = dynamic(
  () => import("./surfaces/RelationshipStabilityMatrix").then((m) => m.RelationshipStabilityMatrix),
  { loading: () => <VenextPanelSkeleton /> },
);
const SponsorshipInfluenceObservatory = dynamic(
  () => import("./surfaces/SponsorshipInfluenceObservatory").then((m) => m.SponsorshipInfluenceObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const CommercialAiBriefingPanel = dynamic(
  () => import("./surfaces/CommercialAiBriefingPanel").then((m) => m.CommercialAiBriefingPanel),
  { loading: () => <VenextPanelSkeleton /> },
);
const NetworkInterventionQueue = dynamic(
  () => import("./surfaces/NetworkInterventionQueue").then((m) => m.NetworkInterventionQueue),
  { loading: () => <VenextPanelSkeleton /> },
);


type Props = {
  realtimeGateway: PoleRealtimeGateway;
};

export function CommercialNetworkWorkspace({ realtimeGateway }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation } = useAdaptiveQualityMode();
  const mapEnabled = flags.logistics_map_enabled !== false;
  const enabled = flags.commercial_network_enabled !== false;
  const { bundle, loading, hydratedVia } = useCommercialNetworkData(
    COMMERCIAL_NETWORK_DEMO_ORGANIZATION_ID,
    enabled && hydrated,
  );

  const latestSignal = useMemo(() => realtimeGateway.stream[0], [realtimeGateway.stream]);
  const rtEnabled = flags.realtime_signals_enabled !== false;
  const lowPower = lowBandwidth || lowAnimation;

  if (!hydrated) {
    return <p className="px-2 text-xs text-slate-500">Hydrating industrial policies…</p>;
  }

  if (!enabled) {
    return (
      <div className="m-2 rounded border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-400">
        Commercial / network intelligence disabled by{" "}
        <span className="font-mono text-cyan-200/80">commercial_network_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="border-b border-slate-800/90 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-200/80">Commercial · Network</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">Distribution ecosystem command</h2>
        <p className="max-w-3xl text-xs text-slate-500">
          Closed-graph commerce observatory — relationship health, downstream pressure, sponsorship governance. Demo org:{" "}
          <span className="font-mono text-slate-400">{COMMERCIAL_NETWORK_DEMO_ORGANIZATION_ID}</span>
        </p>
        {loading ? <p className="mt-2 text-[11px] text-slate-500">Progressive hydration…</p> : null}
        {!loading && hydratedVia ? (
          <p className="mt-1 text-[10px] text-slate-600">
            Payload: {hydratedVia === "bundle" ? "commercial bundle (single request)" : "parallel endpoints (fallback)"}
          </p>
        ) : null}
      </div>

      {rtEnabled ? (
        <CommercialRealtimeStrip
          connected={realtimeGateway.connected}
          demoMode={realtimeGateway.demoMode}
          liveChannel={realtimeGateway.liveChannel}
          latest={latestSignal}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
          <CommercialNetworkOverview data={bundle.overview} />
          <RelationshipIntelligenceSurface data={bundle.relationships} />
          <DistributorPerformanceObservatory data={bundle.distributors} />
          <RetailerActivityRadar data={bundle.retailers} />
        </div>
        <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
          <CommercialExpansionMap
            organizationId={COMMERCIAL_NETWORK_DEMO_ORGANIZATION_ID}
            data={bundle.expansionMap}
            lowPower={lowPower}
            mapEnabled={mapEnabled}
          />
          <RelationshipStabilityMatrix data={bundle.stabilityMatrix} />
          <SponsorshipInfluenceObservatory data={bundle.sponsorship} />
          <CommercialAiBriefingPanel data={bundle.briefing} />
          <NetworkInterventionQueue data={bundle.interventions} />
        </div>
      </div>
    </div>
  );
}
