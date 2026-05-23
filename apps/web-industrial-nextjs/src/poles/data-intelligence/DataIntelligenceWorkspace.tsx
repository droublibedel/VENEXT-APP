"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { DataIntelligenceRealtimeStrip } from "./DataIntelligenceRealtimeStrip";
import { useDataIntelligenceData } from "./useDataIntelligenceData";
import type { DataIntelligenceOrgResolution } from "./resolveDataIntelligenceOrganizationId";
import type {
  AnomalyIntelligenceResponse,
  CrossPoleCorrelationResponse,
  DataIntelligenceBriefingResponse,
  DataIntelligenceOverviewResponse,
  DataQualityIntelligenceResponse,
  DecisionSimulationResponse,
  EconomicOntologyResponse,
  EconomicScoreResponse,
  GraphIntelligenceResponse,
  IntelligenceInterventionsResponse,
  PredictiveSignalsResponse,
  TerritoryIntelligenceResponse,
} from "@venext/shared-contracts";

const DataOverview = dynamic(() => import("./surfaces/DataOverview").then((m) => m.DataOverview), { loading: () => <VenextPanelSkeleton /> });
const OntologyGraphSurface = dynamic(() => import("./surfaces/OntologyGraphSurface").then((m) => m.OntologyGraphSurface), {
  loading: () => <VenextPanelSkeleton />,
});
const CrossPoleCorrelationSurface = dynamic(
  () => import("./surfaces/CrossPoleCorrelationSurface").then((m) => m.CrossPoleCorrelationSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const AnomalyRadar = dynamic(() => import("./surfaces/AnomalyRadar").then((m) => m.AnomalyRadar), { loading: () => <VenextPanelSkeleton /> });
const PredictiveSignalsSurface = dynamic(
  () => import("./surfaces/PredictiveSignalsSurface").then((m) => m.PredictiveSignalsSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const TerritoryIntelligenceSurface = dynamic(
  () => import("./surfaces/TerritoryIntelligenceSurface").then((m) => m.TerritoryIntelligenceSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const GraphIntelligenceSurface = dynamic(
  () => import("./surfaces/GraphIntelligenceSurface").then((m) => m.GraphIntelligenceSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const DecisionSimulationSurface = dynamic(
  () => import("./surfaces/DecisionSimulationSurface").then((m) => m.DecisionSimulationSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const EconomicScoreSurface = dynamic(
  () => import("./surfaces/EconomicScoreSurface").then((m) => m.EconomicScoreSurface),
  { loading: () => <VenextPanelSkeleton /> },
);
const DataQualitySurface = dynamic(() => import("./surfaces/DataQualitySurface").then((m) => m.DataQualitySurface), {
  loading: () => <VenextPanelSkeleton />,
});
const IntelligenceAiBriefingPanel = dynamic(
  () => import("./surfaces/IntelligenceAiBriefingPanel").then((m) => m.IntelligenceAiBriefingPanel),
  { loading: () => <VenextPanelSkeleton tall /> },
);
const IntelligenceInterventionQueue = dynamic(
  () => import("./surfaces/IntelligenceInterventionQueue").then((m) => m.IntelligenceInterventionQueue),
  { loading: () => <VenextPanelSkeleton tall /> },
);


type Props = { realtimeGateway: PoleRealtimeGateway; organizationResolution: DataIntelligenceOrgResolution };

export function DataIntelligenceWorkspace({ realtimeGateway, organizationResolution }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation } = useAdaptiveQualityMode();
  const enabled = flags.data_intelligence_enabled !== false;
  const { bundle, loading, hydratedVia } = useDataIntelligenceData(organizationResolution.organizationId, enabled && hydrated);
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

  const ov = bundle.overview as DataIntelligenceOverviewResponse | undefined;
  const on = bundle.ontology as EconomicOntologyResponse | undefined;
  const cr = bundle.correlations as CrossPoleCorrelationResponse | undefined;
  const an = bundle.anomalies as AnomalyIntelligenceResponse | undefined;
  const pr = bundle.predictiveSignals as PredictiveSignalsResponse | undefined;
  const te = bundle.territoryIntelligence as TerritoryIntelligenceResponse | undefined;
  const gr = bundle.graphIntelligence as GraphIntelligenceResponse | undefined;
  const ds = bundle.decisionSimulation as DecisionSimulationResponse | undefined;
  const es = bundle.economicScore as EconomicScoreResponse | undefined;
  const dq = bundle.dataQuality as DataQualityIntelligenceResponse | undefined;
  const br = bundle.briefing as DataIntelligenceBriefingResponse | undefined;
  const iv = bundle.interventions as IntelligenceInterventionsResponse | undefined;

  if (!hydrated) {
    return <p className="px-2 text-xs text-slate-500">Hydrating industrial policies…</p>;
  }

  if (!enabled) {
    return (
      <div className="m-2 rounded border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-400">
        Data intelligence disabled by <span className="font-mono text-cyan-200/80">data_intelligence_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 px-2 pb-4">
      <div className="border-b border-slate-800/90 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-200/80">Data · economic intelligence</p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">Cross-pole economic operating system</h2>
        <p className="max-w-3xl text-xs text-slate-500">
          Correlation, propagation, simulation — not BI dashboards.{" "}
          <span className="font-mono text-slate-400">{organizationResolution.organizationId}</span>
          {organizationResolution.usedDemoFallback ? (
            <span className="ml-2 rounded border border-amber-800/50 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-100/90">
              {organizationResolution.sourceLabel}
            </span>
          ) : (
            <span className="ml-2 text-[10px] text-emerald-200/80">{organizationResolution.sourceLabel}</span>
          )}
        </p>
        {loading ? <p className="mt-2 text-[11px] text-slate-500">Progressive hydration…</p> : null}
        {!loading && hydratedVia ? (
          <p className="mt-1 text-[10px] text-slate-600">
            Payload: {hydratedVia === "bundle" ? "data-intelligence bundle" : "sequential panel refresh"}
          </p>
        ) : null}
        {lowPower ? (
          <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100/90">
            Mode allégé — surfaces chargées progressivement.
          </p>
        ) : null}
      </div>

      {rtEnabled ? (
        <DataIntelligenceRealtimeStrip
          connected={realtimeGateway.connected}
          demoMode={realtimeGateway.demoMode}
          liveChannel={realtimeGateway.liveChannel}
          latest={latestSignal}
        />
      ) : null}

      <DataOverview data={ov} />
      <OntologyGraphSurface data={on} />
      <div className="grid gap-3 lg:grid-cols-2">
        <CrossPoleCorrelationSurface data={cr} />
        <AnomalyRadar data={an} />
      </div>
      {heavyVisible ? (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <PredictiveSignalsSurface data={pr} />
            <TerritoryIntelligenceSurface data={te} />
          </div>
          <GraphIntelligenceSurface data={gr} />
          <DecisionSimulationSurface data={ds} />
          <EconomicScoreSurface data={es} />
          <DataQualitySurface data={dq} />
          <IntelligenceAiBriefingPanel data={br} />
          <IntelligenceInterventionQueue data={iv} />
        </>
      ) : null}
    </div>
  );
}
