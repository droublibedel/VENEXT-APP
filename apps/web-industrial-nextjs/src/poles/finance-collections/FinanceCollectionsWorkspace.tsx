"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { FINANCE_COLLECTIONS_DEMO_ORGANIZATION_ID } from "./constants";
import { FinanceCollectionsRealtimeStrip } from "./FinanceCollectionsRealtimeStrip";
import { useFinanceCollectionsData } from "./useFinanceCollectionsData";
import type {
  CashflowIntelligenceResponse,
  CollectionPrioritiesResponse,
  CreditRiskMatrixResponse,
  FinanceCollectionsBriefingResponse,
  FinanceOverviewResponse,
  FinancialInterventionsResponse,
  PaymentAnomalyRadarResponse,
  PaymentBehaviorObservatoryResponse,
  PaymentPressureRadarResponse,
  ReceivablesHealthResponse,
  WalletLiquiditySurfaceResponse,
} from "@venext/shared-contracts";

const FinanceOverview = dynamic(() => import("./surfaces/FinanceOverview").then((m) => m.FinanceOverview), {
  loading: () => <VenextPanelSkeleton />,
});
const PaymentPressureRadar = dynamic(() => import("./surfaces/PaymentPressureRadar").then((m) => m.PaymentPressureRadar), {
  loading: () => <VenextPanelSkeleton />,
});
const ReceivablesHealthSurface = dynamic(
  () => import("./surfaces/ReceivablesHealthSurface").then((m) => m.ReceivablesHealthSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const PaymentBehaviorObservatory = dynamic(
  () => import("./surfaces/PaymentBehaviorObservatory").then((m) => m.PaymentBehaviorObservatory),
  { loading: () => <VenextPanelSkeleton /> },
);
const WalletLiquiditySurface = dynamic(
  () => import("./surfaces/WalletLiquiditySurface").then((m) => m.WalletLiquiditySurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const CreditRiskMatrix = dynamic(() => import("./surfaces/CreditRiskMatrix").then((m) => m.CreditRiskMatrix), {
  loading: () => <VenextPanelSkeleton />,
});
const CashflowIntelligenceSurface = dynamic(
  () => import("./surfaces/CashflowIntelligenceSurface").then((m) => m.CashflowIntelligenceSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const PaymentAnomalyRadar = dynamic(() => import("./surfaces/PaymentAnomalyRadar").then((m) => m.PaymentAnomalyRadar), {
  loading: () => <VenextPanelSkeleton />,
});
const FinanceAiBriefingPanel = dynamic(
  () => import("./surfaces/FinanceAiBriefingPanel").then((m) => m.FinanceAiBriefingPanel),
  { loading: () => <VenextPanelSkeleton tall /> },
);
const CollectionPriorityQueue = dynamic(
  () => import("./surfaces/CollectionPriorityQueue").then((m) => m.CollectionPriorityQueue),
  { loading: () => <VenextPanelSkeleton /> },
);
const FinancialInterventionQueue = dynamic(
  () => import("./surfaces/FinancialInterventionQueue").then((m) => m.FinancialInterventionQueue),
  { loading: () => <VenextPanelSkeleton tall /> },
);


type Props = { realtimeGateway: PoleRealtimeGateway };

export function FinanceCollectionsWorkspace({ realtimeGateway }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation } = useAdaptiveQualityMode();
  const enabled = flags.finance_collections_enabled !== false;
  const { bundle, loading, hydratedVia } = useFinanceCollectionsData(
    FINANCE_COLLECTIONS_DEMO_ORGANIZATION_ID,
    enabled && hydrated,
  );
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

  const ov = bundle.overview as FinanceOverviewResponse | undefined;
  const pp = bundle.paymentPressure as PaymentPressureRadarResponse | undefined;
  const rh = bundle.receivablesHealth as ReceivablesHealthResponse | undefined;
  const pb = bundle.paymentBehavior as PaymentBehaviorObservatoryResponse | undefined;
  const wl = bundle.walletLiquidity as WalletLiquiditySurfaceResponse | undefined;
  const cr = bundle.creditRisk as CreditRiskMatrixResponse | undefined;
  const cf = bundle.cashflow as CashflowIntelligenceResponse | undefined;
  const pa = bundle.paymentAnomalies as PaymentAnomalyRadarResponse | undefined;
  const cp = bundle.collectionPriorities as CollectionPrioritiesResponse | undefined;
  const br = bundle.briefing as FinanceCollectionsBriefingResponse | undefined;
  const iv = bundle.interventions as FinancialInterventionsResponse | undefined;

  if (!hydrated) {
    return <p className="px-2 text-xs text-slate-500">Hydrating industrial policies…</p>;
  }

  if (!enabled) {
    return (
      <div className="m-2 rounded border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-400">
        Finance / encaissements pole disabled by <span className="font-mono text-rose-200/80">finance_collections_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="border-b border-slate-800/90 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-rose-200/80">Finance · encaissements</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">Network treasury intelligence</h2>
        <p className="max-w-3xl text-xs text-slate-500">
          Supervise receivables, payment discipline, liquidity, and credit exposure — operational cockpit, not accounting ERP. Demo org:{" "}
          <span className="font-mono text-slate-400">{FINANCE_COLLECTIONS_DEMO_ORGANIZATION_ID}</span>
        </p>
        {loading ? <p className="mt-2 text-[11px] text-slate-500">Progressive hydration…</p> : null}
        {!loading && hydratedVia ? (
          <p className="mt-1 text-[10px] text-slate-600">
            Payload: {hydratedVia === "bundle" ? "finance-collections bundle (single request)" : "sequential panel refresh (critical-first)"}
          </p>
        ) : null}
        {lowPower ? (
          <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100/90">
            Mode allégé — surfaces chargées progressivement.
          </p>
        ) : null}
      </div>

      {rtEnabled ? (
        <FinanceCollectionsRealtimeStrip
          connected={realtimeGateway.connected}
          demoMode={realtimeGateway.demoMode}
          liveChannel={realtimeGateway.liveChannel}
          latest={latestSignal}
        />
      ) : null}

      <FinanceOverview data={ov} />
      <PaymentPressureRadar data={pp} />
      <div className="grid gap-3 lg:grid-cols-2">
        <ReceivablesHealthSurface data={rh} />
        <PaymentBehaviorObservatory data={pb} />
      </div>
      {heavyVisible ? (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <WalletLiquiditySurface data={wl} />
            <CreditRiskMatrix data={cr} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <CashflowIntelligenceSurface data={cf} />
            <PaymentAnomalyRadar data={pa} />
          </div>
          <FinanceAiBriefingPanel data={br} />
          <div className="grid gap-3 lg:grid-cols-2">
            <CollectionPriorityQueue data={cp} />
            <FinancialInterventionQueue data={iv} />
          </div>
        </>
      ) : null}
    </div>
  );
}
