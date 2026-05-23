"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { SUPPLY_LOGISTICS_DEMO_ORGANIZATION_ID } from "./constants";
import { SupplyLogisticsRealtimeStrip } from "./SupplyLogisticsRealtimeStrip";
import { useSupplyLogisticsData } from "./useSupplyLogisticsData";

const SupplyOverview = dynamic(() => import("./surfaces/SupplyOverview").then((m) => m.SupplyOverview), {
  loading: () => <VenextPanelSkeleton />,
});
const TerritoryFlowRadar = dynamic(() => import("./surfaces/TerritoryFlowRadar").then((m) => m.TerritoryFlowRadar), {
  loading: () => <VenextPanelSkeleton />,
});
const ShipmentHealthObservatory = dynamic(
  () => import("./surfaces/ShipmentHealthObservatory").then((m) => m.ShipmentHealthObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const DeliveryRouteIntelligence = dynamic(
  () => import("./surfaces/DeliveryRouteIntelligence").then((m) => m.DeliveryRouteIntelligence),
  { loading: () => <VenextPanelSkeleton /> },
);
const WarehousePressureSurface = dynamic(
  () => import("./surfaces/WarehousePressureSurface").then((m) => m.WarehousePressureSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const FulfillmentStabilityMatrix = dynamic(
  () => import("./surfaces/FulfillmentStabilityMatrix").then((m) => m.FulfillmentStabilityMatrix),
  { loading: () => <VenextPanelSkeleton /> },
);
const LoadingSupervisionSurface = dynamic(
  () => import("./surfaces/LoadingSupervisionSurface").then((m) => m.LoadingSupervisionSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const DelayCongestionRadar = dynamic(() => import("./surfaces/DelayCongestionRadar").then((m) => m.DelayCongestionRadar), {
  loading: () => <VenextPanelSkeleton />,
});
const SupplyRiskMatrix = dynamic(() => import("./surfaces/SupplyRiskMatrix").then((m) => m.SupplyRiskMatrix), {
  loading: () => <VenextPanelSkeleton />,
});
const LogisticsAiBriefingPanel = dynamic(
  () => import("./surfaces/LogisticsAiBriefingPanel").then((m) => m.LogisticsAiBriefingPanel),
  { loading: () => <VenextPanelSkeleton /> },
);
const SupplyInterventionQueue = dynamic(
  () => import("./surfaces/SupplyInterventionQueue").then((m) => m.SupplyInterventionQueue),
  { loading: () => <VenextPanelSkeleton tall /> },
);

function PanelSkeleton({ tall, still }: { tall?: boolean; still?: boolean }) {
  return (
    <div
      className={`rounded border border-slate-800 bg-slate-900/50 ${still ? "" : "animate-pulse"} ${tall ? "min-h-[100px]" : "h-14"}`}
    />
  );
}

type Props = { realtimeGateway: PoleRealtimeGateway };

export function SupplyLogisticsWorkspace({ realtimeGateway }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation } = useAdaptiveQualityMode();
  const enabled = flags.supply_logistics_enabled !== false;
  const { bundle, loading, hydratedVia } = useSupplyLogisticsData(SUPPLY_LOGISTICS_DEMO_ORGANIZATION_ID, enabled && hydrated);
  const latestSignal = useMemo(() => realtimeGateway.stream[0], [realtimeGateway.stream]);
  const rtEnabled = flags.realtime_signals_enabled !== false;
  const lowPower = lowBandwidth || lowAnimation;
  const [heavyVisible, setHeavyVisible] = useState(!lowPower);

  useEffect(() => {
    if (!lowPower) {
      setHeavyVisible(true);
      return;
    }
    setHeavyVisible(false);
    const t = window.setTimeout(() => setHeavyVisible(true), 1600);
    return () => window.clearTimeout(t);
  }, [lowPower]);

  const compact = lowPower;

  if (!hydrated) {
    return <p className="px-2 text-xs text-slate-500">Hydrating industrial policies…</p>;
  }

  if (!enabled) {
    return (
      <div className="m-2 rounded border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-400">
        Supply / logistics pole disabled by <span className="font-mono text-emerald-200/80">supply_logistics_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="border-b border-slate-800/90 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-emerald-200/80">Supply · logistics</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">Movement command infrastructure</h2>
        <p className="max-w-3xl text-xs text-slate-500">
          Supervise circulation, corridors, hubs, and execution health — tactical field, not transport ERP. Demo org:{" "}
          <span className="font-mono text-slate-400">{SUPPLY_LOGISTICS_DEMO_ORGANIZATION_ID}</span>
        </p>
        {loading ? <p className="mt-2 text-[11px] text-slate-500">Progressive hydration…</p> : null}
        {!loading && hydratedVia ? (
          <p className="mt-1 text-[10px] text-slate-600">
            Payload:{" "}
            {hydratedVia === "bundle" ? "supply-logistics bundle (single request)" : "sequential panel refresh (critical-first)"}
          </p>
        ) : null}
        {lowPower ? (
          <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100/90">
            Mode allégé actif — priorité aperçu mouvement, briefing, risques et interventions.
          </p>
        ) : null}
      </div>

      {rtEnabled ? (
        <SupplyLogisticsRealtimeStrip
          connected={realtimeGateway.connected}
          demoMode={realtimeGateway.demoMode}
          liveChannel={realtimeGateway.liveChannel}
          latest={latestSignal}
        />
      ) : null}

      {!heavyVisible ? (
        <div className="space-y-3 rounded border border-slate-800/80 bg-slate-950/30 p-3">
          <SupplyOverview data={bundle.overview as never} />
          <LogisticsAiBriefingPanel data={bundle.briefing as never} />
          <SupplyRiskMatrix data={bundle.riskMatrix as never} />
          <SupplyInterventionQueue data={bundle.interventions as never} />
        </div>
      ) : (
        <div className={`grid gap-4 xl:grid-cols-2 ${lowPower ? "motion-reduce:transition-none" : ""}`}>
          <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
            <SupplyOverview data={bundle.overview as never} />
            <TerritoryFlowRadar data={bundle.territoryFlow as never} compact={compact} />
            <ShipmentHealthObservatory data={bundle.shipmentHealth as never} compact={compact} />
            <DeliveryRouteIntelligence data={bundle.routes as never} compact={compact} />
            <WarehousePressureSurface data={bundle.warehousePressure as never} compact={compact} />
            <FulfillmentStabilityMatrix data={bundle.fulfillmentStability as never} />
          </div>
          <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
            <LoadingSupervisionSurface data={bundle.loadingSupervision as never} compact={compact} />
            <DelayCongestionRadar data={bundle.delayRadar as never} compact={compact} />
            <SupplyRiskMatrix data={bundle.riskMatrix as never} />
            <LogisticsAiBriefingPanel data={bundle.briefing as never} />
            <SupplyInterventionQueue data={bundle.interventions as never} />
          </div>
        </div>
      )}
    </div>
  );
}
