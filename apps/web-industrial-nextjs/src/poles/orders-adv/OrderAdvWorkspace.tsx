"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { ORDER_ADV_DEMO_ORGANIZATION_ID } from "./constants";
import { OrderAdvRealtimeStrip } from "./OrderAdvRealtimeStrip";
import { useOrderAdvData } from "./useOrderAdvData";

const OrdersOverview = dynamic(() => import("./surfaces/OrdersOverview").then((m) => m.OrdersOverview), {
  loading: () => <VenextPanelSkeleton />,
});
const ConversationalCommerceObservatory = dynamic(
  () => import("./surfaces/ConversationalCommerceObservatory").then((m) => m.ConversationalCommerceObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const NegotiationIntelligenceSurface = dynamic(
  () => import("./surfaces/NegotiationIntelligenceSurface").then((m) => m.NegotiationIntelligenceSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const OrderPressureRadar = dynamic(() => import("./surfaces/OrderPressureRadar").then((m) => m.OrderPressureRadar), {
  loading: () => <VenextPanelSkeleton />,
});
const GroupBuyingSupervision = dynamic(
  () => import("./surfaces/GroupBuyingSupervision").then((m) => m.GroupBuyingSupervision),
  { loading: () => <VenextPanelSkeleton /> },
);
const ReservationAllocationSurface = dynamic(
  () => import("./surfaces/ReservationAllocationSurface").then((m) => m.ReservationAllocationSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const DeliveryPriorityObservatory = dynamic(
  () => import("./surfaces/DeliveryPriorityObservatory").then((m) => m.DeliveryPriorityObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const AdvCoordinationSurface = dynamic(
  () => import("./surfaces/AdvCoordinationSurface").then((m) => m.AdvCoordinationSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const OrderRiskMatrix = dynamic(() => import("./surfaces/OrderRiskMatrix").then((m) => m.OrderRiskMatrix), {
  loading: () => <VenextPanelSkeleton />,
});
const OrderAiBriefingPanel = dynamic(() => import("./surfaces/OrderAiBriefingPanel").then((m) => m.OrderAiBriefingPanel), {
  loading: () => <VenextPanelSkeleton />,
});
const TransactionInterventionQueue = dynamic(
  () => import("./surfaces/TransactionInterventionQueue").then((m) => m.TransactionInterventionQueue),
  { loading: () => <VenextPanelSkeleton tall /> },
);

function PanelSkeleton({ tall, still }: { tall?: boolean; still?: boolean }) {
  return (
    <div
      className={`rounded border border-slate-800 bg-slate-900/50 ${still ? "" : "animate-pulse"} ${tall ? "min-h-[100px]" : "h-14"}`}
    />
  );
}

type Props = {
  realtimeGateway: PoleRealtimeGateway;
};

export function OrderAdvWorkspace({ realtimeGateway }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation } = useAdaptiveQualityMode();
  const enabled = flags.order_adv_enabled !== false;
  const { bundle, loading, hydratedVia } = useOrderAdvData(ORDER_ADV_DEMO_ORGANIZATION_ID, enabled && hydrated);
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
  const showHeavyPanels = !lowPower || heavyVisible;

  if (!hydrated) {
    return <p className="px-2 text-xs text-slate-500">Hydrating industrial policies…</p>;
  }

  if (!enabled) {
    return (
      <div className="m-2 rounded border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-400">
        Orders / ADV intelligence disabled by <span className="font-mono text-rose-200/80">order_adv_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="border-b border-slate-800/90 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-rose-200/80">Orders · ADV</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">Transactional commerce execution cockpit</h2>
        <p className="max-w-3xl text-xs text-slate-500">
          Supervise negotiations, reservations, grouped buying, and conversational commerce — not ERP tables. Demo org:{" "}
          <span className="font-mono text-slate-400">{ORDER_ADV_DEMO_ORGANIZATION_ID}</span>
        </p>
        {loading ? <p className="mt-2 text-[11px] text-slate-500">Progressive hydration…</p> : null}
        {!loading && hydratedVia ? (
          <p className="mt-1 text-[10px] text-slate-600">
            Payload:{" "}
            {hydratedVia === "bundle" ? "order-adv bundle (single request)" : "sequential panel refresh (critical-first, no parallel snapshot storm)"}
          </p>
        ) : null}
        {lowPower ? (
          <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100/90">
            Mode allégé actif — priorité aperçu, briefing IA, matrice des risques et files d’intervention. Autres panneaux en
            chargement différé.
          </p>
        ) : null}
      </div>

      {rtEnabled ? (
        <OrderAdvRealtimeStrip
          connected={realtimeGateway.connected}
          demoMode={realtimeGateway.demoMode}
          liveChannel={realtimeGateway.liveChannel}
          latest={latestSignal}
        />
      ) : null}

      {!showHeavyPanels ? (
        <div className="space-y-3 rounded border border-slate-800/80 bg-slate-950/30 p-3">
          <OrdersOverview data={bundle.overview as never} />
          <OrderAiBriefingPanel data={bundle.briefing as never} />
          <OrderRiskMatrix data={bundle.riskMatrix as never} />
          <TransactionInterventionQueue data={bundle.interventions as never} />
        </div>
      ) : (
        <div className={`grid gap-4 xl:grid-cols-2 ${lowPower ? "motion-reduce:transition-none" : ""}`}>
          <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
            <OrdersOverview data={bundle.overview as never} />
            <ConversationalCommerceObservatory data={bundle.conversationalCommerce as never} compact={compact} />
            <NegotiationIntelligenceSurface data={bundle.negotiations as never} />
            <OrderPressureRadar data={bundle.orderPressure as never} compact={compact} />
            <GroupBuyingSupervision data={bundle.groupBuying as never} compact={compact} />
            <ReservationAllocationSurface data={bundle.reservations as never} />
          </div>
          <div className="space-y-4 rounded border border-slate-800/80 bg-slate-950/30 p-3">
            <DeliveryPriorityObservatory data={bundle.deliveryPriority as never} compact={compact} />
            <AdvCoordinationSurface data={bundle.advCoordination as never} />
            <OrderRiskMatrix data={bundle.riskMatrix as never} />
            <OrderAiBriefingPanel data={bundle.briefing as never} />
            <TransactionInterventionQueue data={bundle.interventions as never} />
          </div>
        </div>
      )}
    </div>
  );
}
