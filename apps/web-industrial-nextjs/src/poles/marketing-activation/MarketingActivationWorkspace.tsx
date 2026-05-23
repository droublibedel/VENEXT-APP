"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { MARKETING_ACTIVATION_DEMO_ORGANIZATION_ID } from "./constants";
import { MarketingRealtimeStrip } from "./MarketingRealtimeStrip";
import { useMarketingActivationData } from "./useMarketingActivationData";

const ActivationOverview = dynamic(
  () => import("./surfaces/ActivationOverview").then((m) => m.ActivationOverview),
  { loading: () => <VenextPanelSkeleton /> },
);
const SponsorshipPressureObservatory = dynamic(
  () => import("./surfaces/SponsorshipPressureObservatory").then((m) => m.SponsorshipPressureObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const TerritoryActivationRadar = dynamic(
  () => import("./surfaces/TerritoryActivationRadar").then((m) => m.TerritoryActivationRadar),
  { loading: () => <VenextPanelSkeleton /> },
);
const ProductMomentumObservatory = dynamic(
  () => import("./surfaces/ProductMomentumObservatory").then((m) => m.ProductMomentumObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const RetailerEngagementObservatory = dynamic(
  () => import("./surfaces/RetailerEngagementObservatory").then((m) => m.RetailerEngagementObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const CampaignIntelligenceSurface = dynamic(
  () => import("./surfaces/CampaignIntelligenceSurface").then((m) => m.CampaignIntelligenceSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const ActivationOpportunityMap = dynamic(
  () => import("./surfaces/ActivationOpportunityMap").then((m) => m.ActivationOpportunityMap),
  { loading: () => <VenextPanelSkeleton tall /> },
);
const MarketingAiBriefingPanel = dynamic(
  () => import("./surfaces/MarketingAiBriefingPanel").then((m) => m.MarketingAiBriefingPanel),
  { loading: () => <VenextPanelSkeleton /> },
);
const ActivationInterventionQueue = dynamic(
  () => import("./surfaces/ActivationInterventionQueue").then((m) => m.ActivationInterventionQueue),
  { loading: () => <VenextPanelSkeleton /> },
);


type Props = {
  realtimeGateway: PoleRealtimeGateway;
};

export function MarketingActivationWorkspace({ realtimeGateway }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation } = useAdaptiveQualityMode();
  const mapEnabled = flags.logistics_map_enabled !== false;
  const enabled = flags.marketing_activation_enabled !== false;
  const { bundle, loading, hydratedVia } = useMarketingActivationData(
    MARKETING_ACTIVATION_DEMO_ORGANIZATION_ID,
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
        Marketing / activation intelligence disabled by{" "}
        <span className="font-mono text-violet-200/80">marketing_activation_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="border-b border-slate-800/90 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-violet-200/80">Marketing · Activation</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">Commercial activation intelligence</h2>
        <p className="max-w-3xl text-xs text-slate-500">
          Field stimulation observatory — sponsorship pressure, territory excitation, product momentum. Demo org:{" "}
          <span className="font-mono text-slate-400">{MARKETING_ACTIVATION_DEMO_ORGANIZATION_ID}</span>
        </p>
        {loading ? <p className="mt-2 text-[11px] text-slate-500">Progressive hydration…</p> : null}
        {!loading && hydratedVia ? (
          <p className="mt-1 text-[10px] text-slate-600">
            Payload: {hydratedVia === "bundle" ? "activation bundle (single request)" : "parallel endpoints (fallback)"}
          </p>
        ) : null}
      </div>

      {rtEnabled ? (
        <MarketingRealtimeStrip
          connected={realtimeGateway.connected}
          demoMode={realtimeGateway.demoMode}
          liveChannel={realtimeGateway.liveChannel}
          latest={latestSignal}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
          <ActivationOverview data={bundle.overview as never} />
          <SponsorshipPressureObservatory data={bundle.sponsorshipPressure as never} />
          <TerritoryActivationRadar data={bundle.territoryRadar as never} />
          <ProductMomentumObservatory data={bundle.productMomentum as never} />
          <RetailerEngagementObservatory data={bundle.retailerEngagement as never} />
        </div>
        <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
          <ActivationOpportunityMap
            organizationId={MARKETING_ACTIVATION_DEMO_ORGANIZATION_ID}
            data={bundle.opportunityMap}
            lowPower={lowPower}
            mapEnabled={mapEnabled}
          />
          <CampaignIntelligenceSurface data={bundle.campaigns as never} />
          <MarketingAiBriefingPanel data={bundle.briefing as never} />
          <ActivationInterventionQueue data={bundle.interventions as never} />
        </div>
      </div>
    </div>
  );
}
