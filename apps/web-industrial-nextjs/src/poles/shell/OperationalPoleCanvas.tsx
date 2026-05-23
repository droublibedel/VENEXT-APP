"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CommercialRelationshipGraphBundle,
  DataIntelligenceBundleResponse,
  EconomicCommandBundle,
  EconomicCoordinationBundle,
  EconomicMemoryBundle,
  EconomicPropagationBundle,
  EconomicScenariosBundle,
  FinanceCollectionsBundleResponse,
  IndustrialOperationalContinuityBundle,
  IndustrialSituationRoomBundle,
  MarketingActivationBundleResponse,
} from "@venext/shared-contracts";

import { DEMO_OPERATIONAL_BUNDLE } from "../demo/demo-operational-static";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleAiInsights } from "../hooks/usePoleAiInsights";
import { usePoleRealtimeGateway, type PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { buildMarketingActivationCanvasGeo } from "../marketing-activation/marketing-activation-canvas-adapter";
import {
  buildFinanceCollectionsCanvasGeo,
  labeledDemoOperationalFallback as financeLabeledFallback,
} from "../finance-collections/finance-collections-canvas-adapter";
import {
  buildSupplyLogisticsCanvasGeo,
  labeledDemoOperationalFallback,
} from "../supply-logistics/supply-logistics-canvas-adapter";
import {
  buildDataIntelligenceCanvasGeo,
  dataIntelligenceLabeledFallback,
} from "../data-intelligence/data-intelligence-canvas-adapter";
import {
  buildEconomicMemoryCanvasGeo,
  economicMemoryLabeledFallback,
} from "../economic-memory/economic-memory-canvas-adapter";
import {
  buildEconomicPropagationCanvasGeo,
  economicPropagationLabeledFallback,
} from "../economic-propagation/economic-propagation-canvas-adapter";
import {
  buildEconomicScenariosCanvasGeo,
  economicScenariosLabeledFallback,
} from "../economic-scenarios/economic-scenarios-canvas-adapter";
import {
  buildEconomicCoordinationCanvasGeo,
  economicCoordinationLabeledFallback,
} from "../economic-coordination/economic-coordination-canvas-adapter";
import {
  buildEconomicCommandCanvasGeo,
  economicCommandLabeledFallback,
} from "../economic-command/economic-command-canvas-adapter";
import {
  buildIndustrialOperationalContinuityCanvasGeo,
  industrialOperationalContinuityLabeledFallback,
} from "../industrial-operational-continuity/industrial-operational-continuity-canvas-adapter";
import {
  buildIndustrialSituationRoomCanvasGeo,
  industrialSituationRoomLabeledFallback,
} from "../industrial-situation-room/industrial-situation-room-canvas-adapter";
import {
  buildCommercialRelationshipGraphCanvasGeo,
  commercialRelationshipGraphLabeledFallback,
} from "../commercial-relationship-graph/commercial-relationship-graph-canvas-adapter";
import { POLE_INTEL_MANIFEST } from "../pole-intel-manifest";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { MapControlEngine } from "../map/MapControlEngine";
import { OperationalDensityRibbon } from "../widgets/OperationalDensityRibbon";
import { AdaptiveWorkspaceLayout } from "./AdaptiveWorkspaceLayout";
import { ContextHeader } from "./ContextHeader";
import { ContextualActionRail } from "./ContextualActionRail";
import { SignalStream } from "./SignalStream";

type GeoFC = { type: "FeatureCollection"; features: unknown[] };

export type { PoleRealtimeGateway };

type Props = {
  poleSlug: PoleSlug;
  /** Single shared gateway — avoids duplicate WebSocket when hoisted from PoleWorkspace (Instruction 11A). */
  realtimeGateway?: PoleRealtimeGateway;
  /** Instruction 13A — when set for `marketing-activation`, canvas hydrates from activation bundle (not only demo-operational). */
  marketingActivationOrganizationId?: string;
  /** Instruction 15A — producer org for `/supply-logistics/bundle` map hydration. */
  supplyLogisticsOrganizationId?: string;
  /** Instruction 16 — producer org for `/finance-collections/bundle` map hydration. */
  financeCollectionsOrganizationId?: string;
  /** Instruction 17 — producer org for `/data-intelligence/bundle` map hydration. */
  dataIntelligenceOrganizationId?: string;
  /** Instruction 18.1 — producer org for `/economic-propagation/bundle` map hydration. */
  economicPropagationOrganizationId?: string;
  /** Instruction 18.2 — producer org for `/economic-memory/bundle` map hydration. */
  economicMemoryOrganizationId?: string;
  /** Instruction 18.3 — producer org for `/economic-scenarios/bundle` map hydration. */
  economicScenariosOrganizationId?: string;
  /** Instruction 18.4 — producer org for economic coordination BFF bundle map hydration. */
  economicCoordinationOrganizationId?: string;
  /** When set for `economic-coordination`, reuses workspace bundle instead of a second fetch (18.4A). */
  economicCoordinationCanvasHydration?: {
    bundle: EconomicCoordinationBundle | null;
    loading: boolean;
    error: string | null;
  };
  /** Instruction 18.5 — producer org for economic command BFF bundle map hydration. */
  economicCommandOrganizationId?: string;
  /** When set for `economic-command`, reuses workspace bundle instead of a second fetch (18.5). */
  economicCommandCanvasHydration?: {
    bundle: EconomicCommandBundle | null;
    loading: boolean;
    error: string | null;
  };
  /** Instruction 18.6 — producer org for industrial situation room BFF bundle map hydration. */
  industrialSituationRoomOrganizationId?: string;
  /** When set for `industrial-situation-room`, reuses workspace bundle instead of a second fetch. */
  industrialSituationRoomCanvasHydration?: {
    bundle: IndustrialSituationRoomBundle | null;
    loading: boolean;
    error: string | null;
  };
  /** Instruction 18.7 — producer org for industrial operational continuity BFF bundle map hydration. */
  industrialOperationalContinuityOrganizationId?: string;
  /** When set for `industrial-operational-continuity`, reuses workspace bundle instead of a second fetch. */
  industrialOperationalContinuityCanvasHydration?: {
    bundle: IndustrialOperationalContinuityBundle | null;
    loading: boolean;
    error: string | null;
  };
  /** Instruction 19.1 — producer org for commercial relationship graph bundle map hydration. */
  commercialRelationshipGraphOrganizationId?: string;
  /** When set for `commercial-relationship-graph`, reuses workspace bundle instead of a second fetch. */
  commercialRelationshipGraphCanvasHydration?: {
    bundle: CommercialRelationshipGraphBundle | null;
    loading: boolean;
    error: string | null;
  };
};

export function OperationalPoleCanvas({
  poleSlug,
  realtimeGateway,
  marketingActivationOrganizationId,
  supplyLogisticsOrganizationId,
  financeCollectionsOrganizationId,
  dataIntelligenceOrganizationId,
  economicPropagationOrganizationId,
  economicMemoryOrganizationId,
  economicScenariosOrganizationId,
  economicCoordinationOrganizationId,
  economicCoordinationCanvasHydration,
  economicCommandOrganizationId,
  economicCommandCanvasHydration,
  industrialSituationRoomOrganizationId,
  industrialSituationRoomCanvasHydration,
  industrialOperationalContinuityOrganizationId,
  industrialOperationalContinuityCanvasHydration,
  commercialRelationshipGraphOrganizationId,
  commercialRelationshipGraphCanvasHydration,
}: Props) {
  const entry = getPoleEntry(poleSlug);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation, setLowBandwidth, setLowAnimation } =
    useAdaptiveQualityMode();
  const [aiRefresh, setAiRefresh] = useState(0);
  const [zonesRoutes, setZonesRoutes] = useState<{
    zones: GeoFC;
    routes: GeoFC;
  }>({
    zones: DEMO_OPERATIONAL_BUNDLE.zones as GeoFC,
    routes: DEMO_OPERATIONAL_BUNDLE.routes as GeoFC,
  });
  const [marketingCanvas, setMarketingCanvas] = useState<{
    source: "marketing_activation_bundle" | "demo_operational_fallback";
    detail: string;
    bundle?: MarketingActivationBundleResponse | null;
  } | null>(null);
  const [supplyCanvasMeta, setSupplyCanvasMeta] = useState<{ source: string; detail: string } | null>(null);
  const [financeCanvasMeta, setFinanceCanvasMeta] = useState<{ source: string; detail: string } | null>(null);
  const [dataIntelligenceCanvasMeta, setDataIntelligenceCanvasMeta] = useState<{ source: string; detail: string } | null>(null);
  const [economicPropagationCanvasMeta, setEconomicPropagationCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);
  const [economicMemoryCanvasMeta, setEconomicMemoryCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);
  const [economicScenariosCanvasMeta, setEconomicScenariosCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);
  const [economicCoordinationCanvasMeta, setEconomicCoordinationCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);
  const [economicCommandCanvasMeta, setEconomicCommandCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);
  const [industrialSituationRoomCanvasMeta, setIndustrialSituationRoomCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);
  const [industrialOperationalContinuityCanvasMeta, setIndustrialOperationalContinuityCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);
  const [commercialRelationshipGraphCanvasMeta, setCommercialRelationshipGraphCanvasMeta] = useState<{
    source: string;
    detail: string;
    geometryMode?: "SYMBOLIC_PROJECTION";
    projectionLabelFr?: string;
  } | null>(null);

  const intel = POLE_INTEL_MANIFEST[poleSlug];

  const aiEnabled = flags.ai_assistant_enabled !== false;
  const { bundle, loading: aiLoading } = usePoleAiInsights({
    poleSlug,
    enabled: aiEnabled,
    refreshToken: aiRefresh,
  });

  const internalRealtime = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: realtimeGateway === undefined && flags.realtime_signals_enabled !== false,
  });
  const { connected, stream, demoMode, liveChannel } = realtimeGateway ?? internalRealtime;

  useEffect(() => {
    let cancelled = false;
    if (poleSlug !== "commercial-relationship-graph") {
      setCommercialRelationshipGraphCanvasMeta(null);
    }
    const loadDemoOperational = () =>
      fetch(`/api/core/v1/poles/demo-operational/${poleSlug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { zones?: GeoFC; routes?: GeoFC } | null) => {
          if (cancelled || !data?.zones || !data?.routes) return;
          setZonesRoutes({ zones: data.zones, routes: data.routes });
        })
        .catch(() => {});

    if (poleSlug === "supply-logistics") {
      setMarketingCanvas(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!supplyLogisticsOrganizationId || !hydrated || flags.supply_logistics_enabled === false) {
        setSupplyCanvasMeta(null);
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/core/v1/supply-logistics/bundle?organizationId=${encodeURIComponent(supplyLogisticsOrganizationId)}`;
          const r = await fetch(url);
          const raw = r.ok ? await r.json().catch(() => null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildSupplyLogisticsCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setSupplyCanvasMeta({ source: geo.source, detail: geo.detail });
            return;
          }
          const fb = labeledDemoOperationalFallback(
            "Bundle endpoint did not return v1 JSON — labeled demo-operational fallback (Instruction 15A).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setSupplyCanvasMeta({ source: fb.source, detail: fb.detail });
        } catch {
          if (cancelled) return;
          const fb = labeledDemoOperationalFallback(
            "Bundle fetch failed — labeled demo-operational fallback (Instruction 15A).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setSupplyCanvasMeta({ source: fb.source, detail: fb.detail });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "finance-collections") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!financeCollectionsOrganizationId || !hydrated || flags.finance_collections_enabled === false) {
        setFinanceCanvasMeta(null);
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/core/v1/finance-collections/bundle?organizationId=${encodeURIComponent(financeCollectionsOrganizationId)}`;
          const r = await fetch(url, { headers: { "x-venext-acting-organization-id": financeCollectionsOrganizationId } });
          const raw = r.ok ? ((await r.json().catch(() => null)) as FinanceCollectionsBundleResponse | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildFinanceCollectionsCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setFinanceCanvasMeta({ source: geo.source, detail: geo.detail });
            return;
          }
          const fb = financeLabeledFallback("Finance bundle unavailable — labeled demo-operational fallback (Instruction 16).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setFinanceCanvasMeta({ source: fb.source, detail: fb.detail });
        } catch {
          if (cancelled) return;
          const fb = financeLabeledFallback("Finance bundle fetch failed — labeled demo-operational fallback (Instruction 16).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setFinanceCanvasMeta({ source: fb.source, detail: fb.detail });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "data-intelligence") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!dataIntelligenceOrganizationId || !hydrated || flags.data_intelligence_enabled === false) {
        setDataIntelligenceCanvasMeta(null);
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/core/v1/data-intelligence/bundle?organizationId=${encodeURIComponent(dataIntelligenceOrganizationId)}`;
          const r = await fetch(url, { headers: { "x-venext-acting-organization-id": dataIntelligenceOrganizationId } });
          const raw = r.ok ? ((await r.json().catch(() => null)) as DataIntelligenceBundleResponse | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildDataIntelligenceCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setDataIntelligenceCanvasMeta({ source: geo.source, detail: geo.detail });
            return;
          }
          const fb = dataIntelligenceLabeledFallback("Data intelligence bundle unavailable — demo-operational fallback (Instruction 17).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setDataIntelligenceCanvasMeta({ source: fb.source, detail: fb.detail });
        } catch {
          if (cancelled) return;
          const fb = dataIntelligenceLabeledFallback("Data intelligence bundle fetch failed — demo-operational fallback (Instruction 17).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setDataIntelligenceCanvasMeta({ source: fb.source, detail: fb.detail });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "economic-propagation") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!economicPropagationOrganizationId || !hydrated || flags.economic_propagation_enabled === false) {
        setEconomicPropagationCanvasMeta(null);
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/core/v1/economic-propagation/bundle?organizationId=${encodeURIComponent(economicPropagationOrganizationId)}`;
          const r = await fetch(url, { headers: { "x-venext-acting-organization-id": economicPropagationOrganizationId } });
          const raw = r.ok ? ((await r.json().catch(() => null)) as EconomicPropagationBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildEconomicPropagationCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setEconomicPropagationCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = economicPropagationLabeledFallback(
            "Economic propagation bundle unavailable — labeled fallback (Instruction 18.1).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicPropagationCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = economicPropagationLabeledFallback("Economic propagation bundle fetch failed — labeled fallback (Instruction 18.1).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicPropagationCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "economic-memory") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!economicMemoryOrganizationId || !hydrated || flags.economic_memory_enabled === false) {
        setEconomicMemoryCanvasMeta(null);
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/core/v1/economic-memory/bundle?organizationId=${encodeURIComponent(economicMemoryOrganizationId)}`;
          const r = await fetch(url, { headers: { "x-venext-acting-organization-id": economicMemoryOrganizationId } });
          const raw = r.ok ? ((await r.json().catch(() => null)) as EconomicMemoryBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildEconomicMemoryCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setEconomicMemoryCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = economicMemoryLabeledFallback("Economic memory bundle unavailable — labeled fallback (Instruction 18.2).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicMemoryCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = economicMemoryLabeledFallback("Economic memory bundle fetch failed — labeled fallback (Instruction 18.2).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicMemoryCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "economic-scenarios") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!economicScenariosOrganizationId || !hydrated || flags.economic_scenarios_enabled === false) {
        setEconomicScenariosCanvasMeta(null);
        setEconomicCoordinationCanvasMeta(null);
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/core/v1/economic-scenarios/bundle?organizationId=${encodeURIComponent(economicScenariosOrganizationId)}`;
          const r = await fetch(url, { headers: { "x-venext-acting-organization-id": economicScenariosOrganizationId } });
          const raw = r.ok ? ((await r.json().catch(() => null)) as EconomicScenariosBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildEconomicScenariosCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setEconomicScenariosCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = economicScenariosLabeledFallback("Economic scenarios bundle unavailable — labeled fallback (Instruction 18.3).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicScenariosCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = economicScenariosLabeledFallback("Economic scenarios bundle fetch failed — labeled fallback (Instruction 18.3).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicScenariosCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "economic-coordination") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!economicCoordinationOrganizationId || !hydrated || flags.economic_coordination_enabled === false) {
        setEconomicCoordinationCanvasMeta(null);
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      if (economicCoordinationCanvasHydration) {
        if (economicCoordinationCanvasHydration.loading) {
          setEconomicCoordinationCanvasMeta(null);
          setZonesRoutes({
            zones: { type: "FeatureCollection", features: [] },
            routes: { type: "FeatureCollection", features: [] },
          });
          return () => {
            cancelled = true;
          };
        }
        if (economicCoordinationCanvasHydration.bundle?.version === "1") {
          const geo = buildEconomicCoordinationCanvasGeo(economicCoordinationCanvasHydration.bundle);
          setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
          setEconomicCoordinationCanvasMeta({
            source: geo.source,
            detail: geo.detail,
            geometryMode: geo.geometryMode,
            projectionLabelFr: geo.projectionLabelFr,
          });
          return () => {
            cancelled = true;
          };
        }
        const fb = economicCoordinationLabeledFallback(
          economicCoordinationCanvasHydration.error
            ? "Economic coordination bundle unavailable — sequential fallback only (Instruction 18.4A)."
            : "Economic coordination bundle unavailable — labeled fallback (Instruction 18.4).",
        );
        setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
        setEconomicCoordinationCanvasMeta({
          source: fb.source,
          detail: fb.detail,
          geometryMode: fb.geometryMode,
          projectionLabelFr: fb.projectionLabelFr,
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/economic-coordination/v1/economic-coordination/bundle?organizationId=${encodeURIComponent(economicCoordinationOrganizationId)}&projection=summary`;
          const r = await fetch(url, { credentials: "include" });
          const raw = r.ok ? ((await r.json().catch(() => null)) as EconomicCoordinationBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildEconomicCoordinationCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setEconomicCoordinationCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = economicCoordinationLabeledFallback(
            "Economic coordination bundle unavailable — labeled fallback (Instruction 18.4).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicCoordinationCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = economicCoordinationLabeledFallback(
            "Economic coordination bundle fetch failed — labeled fallback (Instruction 18.4).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicCoordinationCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "economic-command") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!economicCommandOrganizationId || !hydrated || flags.economic_command_enabled === false) {
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      if (economicCommandCanvasHydration) {
        if (economicCommandCanvasHydration.loading) {
          setZonesRoutes({
            zones: { type: "FeatureCollection", features: [] },
            routes: { type: "FeatureCollection", features: [] },
          });
          return () => {
            cancelled = true;
          };
        }
        if (economicCommandCanvasHydration.bundle?.version === "1") {
          const geo = buildEconomicCommandCanvasGeo(economicCommandCanvasHydration.bundle);
          setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
          setEconomicCommandCanvasMeta({
            source: geo.source,
            detail: geo.detail,
            geometryMode: geo.geometryMode,
            projectionLabelFr: geo.projectionLabelFr,
          });
          return () => {
            cancelled = true;
          };
        }
        const fb = economicCommandLabeledFallback(
          economicCommandCanvasHydration.error
            ? "Economic command bundle unavailable — sequential fallback only (Instruction 18.5)."
            : "Economic command bundle unavailable — labeled fallback (Instruction 18.5).",
        );
        setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
        setEconomicCommandCanvasMeta({
          source: fb.source,
          detail: fb.detail,
          geometryMode: fb.geometryMode,
          projectionLabelFr: fb.projectionLabelFr,
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/economic-command/v1/economic-command/bundle?organizationId=${encodeURIComponent(economicCommandOrganizationId)}&projection=summary`;
          const r = await fetch(url, { credentials: "include" });
          const raw = r.ok ? ((await r.json().catch(() => null)) as EconomicCommandBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildEconomicCommandCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setEconomicCommandCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = economicCommandLabeledFallback("Economic command bundle unavailable — labeled fallback (Instruction 18.5).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicCommandCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = economicCommandLabeledFallback("Economic command bundle fetch failed — labeled fallback (Instruction 18.5).");
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setEconomicCommandCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "industrial-situation-room") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (!industrialSituationRoomOrganizationId || !hydrated || flags.industrial_situation_room_enabled === false) {
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      if (industrialSituationRoomCanvasHydration) {
        if (industrialSituationRoomCanvasHydration.loading) {
          setZonesRoutes({
            zones: { type: "FeatureCollection", features: [] },
            routes: { type: "FeatureCollection", features: [] },
          });
          return () => {
            cancelled = true;
          };
        }
        if (industrialSituationRoomCanvasHydration.bundle?.version === "1") {
          const geo = buildIndustrialSituationRoomCanvasGeo(industrialSituationRoomCanvasHydration.bundle);
          setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
          setIndustrialSituationRoomCanvasMeta({
            source: geo.source,
            detail: geo.detail,
            geometryMode: geo.geometryMode,
            projectionLabelFr: geo.projectionLabelFr,
          });
          return () => {
            cancelled = true;
          };
        }
        const fb = industrialSituationRoomLabeledFallback(
          industrialSituationRoomCanvasHydration.error
            ? "Industrial situation room bundle unavailable — sequential fallback only (Instruction 18.6)."
            : "Industrial situation room bundle unavailable — labeled fallback (Instruction 18.6).",
        );
        setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
        setIndustrialSituationRoomCanvasMeta({
          source: fb.source,
          detail: fb.detail,
          geometryMode: fb.geometryMode,
          projectionLabelFr: fb.projectionLabelFr,
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/industrial-situation-room/v1/industrial-situation-room/bundle?organizationId=${encodeURIComponent(industrialSituationRoomOrganizationId)}&projection=summary`;
          const r = await fetch(url, { credentials: "include" });
          const raw = r.ok ? ((await r.json().catch(() => null)) as IndustrialSituationRoomBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildIndustrialSituationRoomCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setIndustrialSituationRoomCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = industrialSituationRoomLabeledFallback(
            "Industrial situation room bundle unavailable — labeled fallback (Instruction 18.6).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setIndustrialSituationRoomCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = industrialSituationRoomLabeledFallback(
            "Industrial situation room bundle fetch failed — labeled fallback (Instruction 18.6).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setIndustrialSituationRoomCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "industrial-operational-continuity") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (
        !industrialOperationalContinuityOrganizationId ||
        !hydrated ||
        flags.industrial_operational_continuity_enabled === false
      ) {
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        return () => {
          cancelled = true;
        };
      }

      if (industrialOperationalContinuityCanvasHydration) {
        if (industrialOperationalContinuityCanvasHydration.loading) {
          setZonesRoutes({
            zones: { type: "FeatureCollection", features: [] },
            routes: { type: "FeatureCollection", features: [] },
          });
          return () => {
            cancelled = true;
          };
        }
        if (industrialOperationalContinuityCanvasHydration.bundle?.version === "1") {
          const geo = buildIndustrialOperationalContinuityCanvasGeo(industrialOperationalContinuityCanvasHydration.bundle);
          setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
          setIndustrialOperationalContinuityCanvasMeta({
            source: geo.source,
            detail: geo.detail,
            geometryMode: geo.geometryMode,
            projectionLabelFr: geo.projectionLabelFr,
          });
          return () => {
            cancelled = true;
          };
        }
        const fb = industrialOperationalContinuityLabeledFallback(
          industrialOperationalContinuityCanvasHydration.error
            ? "Industrial operational continuity bundle unavailable — sequential fallback only (Instruction 18.7)."
            : "Industrial operational continuity bundle unavailable — labeled fallback (Instruction 18.7).",
        );
        setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
        setIndustrialOperationalContinuityCanvasMeta({
          source: fb.source,
          detail: fb.detail,
          geometryMode: fb.geometryMode,
          projectionLabelFr: fb.projectionLabelFr,
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/industrial-operational-continuity/v1/industrial-operational-continuity/bundle?organizationId=${encodeURIComponent(industrialOperationalContinuityOrganizationId)}&projection=summary`;
          const r = await fetch(url, { credentials: "include" });
          const raw = r.ok ? ((await r.json().catch(() => null)) as IndustrialOperationalContinuityBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildIndustrialOperationalContinuityCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setIndustrialOperationalContinuityCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = industrialOperationalContinuityLabeledFallback(
            "Industrial operational continuity bundle unavailable — labeled fallback (Instruction 18.7).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setIndustrialOperationalContinuityCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = industrialOperationalContinuityLabeledFallback(
            "Industrial operational continuity bundle fetch failed — labeled fallback (Instruction 18.7).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setIndustrialOperationalContinuityCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (poleSlug === "commercial-relationship-graph") {
      setMarketingCanvas(null);
      setSupplyCanvasMeta(null);
      setFinanceCanvasMeta(null);
      setDataIntelligenceCanvasMeta(null);
      setEconomicPropagationCanvasMeta(null);
      setEconomicMemoryCanvasMeta(null);
      setEconomicScenariosCanvasMeta(null);
      setEconomicCoordinationCanvasMeta(null);
      setEconomicCommandCanvasMeta(null);
      setIndustrialSituationRoomCanvasMeta(null);
      setIndustrialOperationalContinuityCanvasMeta(null);
      if (
        !commercialRelationshipGraphOrganizationId ||
        !hydrated ||
        flags.commercial_relationship_graph_enabled === false
      ) {
        setZonesRoutes({
          zones: { type: "FeatureCollection", features: [] },
          routes: { type: "FeatureCollection", features: [] },
        });
        const fb = commercialRelationshipGraphLabeledFallback(
          "Commercial relationship graph disabled or organization unset — symbolic empty canvas (Instruction 19.1).",
        );
        setCommercialRelationshipGraphCanvasMeta({
          source: fb.source,
          detail: fb.detail,
          geometryMode: fb.geometryMode,
          projectionLabelFr: fb.projectionLabelFr,
        });
        return () => {
          cancelled = true;
        };
      }

      if (commercialRelationshipGraphCanvasHydration) {
        if (commercialRelationshipGraphCanvasHydration.loading) {
          setZonesRoutes({
            zones: { type: "FeatureCollection", features: [] },
            routes: { type: "FeatureCollection", features: [] },
          });
          return () => {
            cancelled = true;
          };
        }
        const hb = commercialRelationshipGraphCanvasHydration.bundle;
        if (hb?.version === "1") {
          const geo = buildCommercialRelationshipGraphCanvasGeo(hb);
          setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
          setCommercialRelationshipGraphCanvasMeta({
            source: geo.source,
            detail: geo.detail,
            geometryMode: geo.geometryMode,
            projectionLabelFr: geo.projectionLabelFr,
          });
          return () => {
            cancelled = true;
          };
        }
        const fb = commercialRelationshipGraphLabeledFallback(
          commercialRelationshipGraphCanvasHydration.error
            ? "Commercial relationship graph bundle error — symbolic empty canvas (Instruction 19.1)."
            : "Commercial relationship graph bundle unavailable — symbolic empty canvas (Instruction 19.1).",
        );
        setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
        setCommercialRelationshipGraphCanvasMeta({
          source: fb.source,
          detail: fb.detail,
          geometryMode: fb.geometryMode,
          projectionLabelFr: fb.projectionLabelFr,
        });
        return () => {
          cancelled = true;
        };
      }

      void (async () => {
        try {
          const url = `/api/commercial-relationship-graph/v1/commercial-relationship-graph/bundle?organizationId=${encodeURIComponent(
            commercialRelationshipGraphOrganizationId,
          )}&projection=summary`;
          const r = await fetch(url, { credentials: "include" });
          const raw = r.ok ? ((await r.json().catch(() => null)) as CommercialRelationshipGraphBundle | null) : null;
          if (cancelled) return;
          if (raw && raw.version === "1") {
            const geo = buildCommercialRelationshipGraphCanvasGeo(raw);
            setZonesRoutes({ zones: geo.zones as GeoFC, routes: geo.routes as GeoFC });
            setCommercialRelationshipGraphCanvasMeta({
              source: geo.source,
              detail: geo.detail,
              geometryMode: geo.geometryMode,
              projectionLabelFr: geo.projectionLabelFr,
            });
            return;
          }
          const fb = commercialRelationshipGraphLabeledFallback(
            "Commercial relationship graph bundle unavailable — symbolic empty canvas (Instruction 19.1).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setCommercialRelationshipGraphCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        } catch {
          if (cancelled) return;
          const fb = commercialRelationshipGraphLabeledFallback(
            "Commercial relationship graph bundle fetch failed — symbolic empty canvas (Instruction 19.1).",
          );
          setZonesRoutes({ zones: fb.zones as GeoFC, routes: fb.routes as GeoFC });
          setCommercialRelationshipGraphCanvasMeta({
            source: fb.source,
            detail: fb.detail,
            geometryMode: fb.geometryMode,
            projectionLabelFr: fb.projectionLabelFr,
          });
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    setSupplyCanvasMeta(null);
    setFinanceCanvasMeta(null);
    setDataIntelligenceCanvasMeta(null);
    setEconomicPropagationCanvasMeta(null);
    setEconomicMemoryCanvasMeta(null);
    setEconomicScenariosCanvasMeta(null);
    setEconomicCoordinationCanvasMeta(null);
    setEconomicCommandCanvasMeta(null);
    setIndustrialSituationRoomCanvasMeta(null);
    setIndustrialOperationalContinuityCanvasMeta(null);
    setCommercialRelationshipGraphCanvasMeta(null);

    const tryMarketingBundleFirst =
      poleSlug === "marketing-activation" &&
      Boolean(marketingActivationOrganizationId) &&
      hydrated &&
      flags.marketing_activation_enabled !== false;

    if (!tryMarketingBundleFirst) {
      setMarketingCanvas(null);
      void loadDemoOperational();
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const url = `/api/core/v1/marketing-activation/bundle?organizationId=${encodeURIComponent(marketingActivationOrganizationId!)}`;
        const br = await fetch(url).then((r) => (r.ok ? r.json() : null));
        if (cancelled) return;
        const geo = buildMarketingActivationCanvasGeo(br as MarketingActivationBundleResponse | null);
        if (geo.source === "marketing_activation_bundle") {
          setMarketingCanvas({ source: geo.source, detail: geo.detail, bundle: br as MarketingActivationBundleResponse });
          setZonesRoutes({ zones: geo.zones, routes: geo.routes });
          return;
        }
        setMarketingCanvas({
          source: "demo_operational_fallback",
          detail: `${geo.detail} Demo-operational overlay.`,
          bundle: br as MarketingActivationBundleResponse | null,
        });
      } catch {
        if (!cancelled) {
          setMarketingCanvas({
            source: "demo_operational_fallback",
            detail: "Marketing activation bundle request failed — demo-operational overlay.",
            bundle: null,
          });
        }
      }
      await loadDemoOperational();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    poleSlug,
    marketingActivationOrganizationId,
    supplyLogisticsOrganizationId,
    financeCollectionsOrganizationId,
    hydrated,
    flags.marketing_activation_enabled,
    flags.supply_logistics_enabled,
    flags.finance_collections_enabled,
    flags.data_intelligence_enabled,
    dataIntelligenceOrganizationId,
    flags.economic_propagation_enabled,
    economicPropagationOrganizationId,
    flags.economic_memory_enabled,
    economicMemoryOrganizationId,
    flags.economic_scenarios_enabled,
    economicScenariosOrganizationId,
    flags.economic_coordination_enabled,
    economicCoordinationOrganizationId,
    economicCoordinationCanvasHydration,
    flags.economic_command_enabled,
    economicCommandOrganizationId,
    economicCommandCanvasHydration,
    flags.industrial_situation_room_enabled,
    industrialSituationRoomOrganizationId,
    industrialSituationRoomCanvasHydration,
    flags.industrial_operational_continuity_enabled,
    industrialOperationalContinuityOrganizationId,
    industrialOperationalContinuityCanvasHydration,
    flags.commercial_relationship_graph_enabled,
    commercialRelationshipGraphOrganizationId,
    commercialRelationshipGraphCanvasHydration,
  ]);

  const aiSummary = useMemo(() => {
    if (poleSlug === "marketing-activation" && marketingCanvas?.bundle?.briefing && marketingCanvas.bundle.briefing.policy !== "DISABLED") {
      const ex = marketingCanvas.bundle.briefing.executiveSummary;
      if (ex) return `${ex} (${marketingCanvas.detail})`;
    }
    if (poleSlug === "marketing-activation" && marketingCanvas?.bundle?.overview) {
      const o = marketingCanvas.bundle.overview;
      return `Activation overview — velocity ${o.activationVelocity.toFixed(2)} · stimulation ${o.territoryStimulation.toFixed(2)}. ${marketingCanvas.detail}`;
    }
    if (bundle?.strategicSummary) return bundle.strategicSummary;
    return `${intel.summaryLine} ${intel.mapHintLine}`;
  }, [poleSlug, marketingCanvas, bundle?.strategicSummary, intel]);

  const operationalAlerts = useMemo(() => {
    const fromAi = bundle?.operationalWarnings ?? [];
    if (flags.weather_signals_enabled !== false) return fromAi;
    return fromAi.filter((w) => !w.toLowerCase().includes("weather"));
  }, [bundle?.operationalWarnings, flags.weather_signals_enabled]);

  const onRefreshInsight = useCallback(() => {
    setAiRefresh((n) => n + 1);
  }, []);

  if (!entry) {
    return (
      <div className="p-6 text-sm text-slate-300">Unknown operational pole.</div>
    );
  }

  if (flags.industrial_poles_enabled === false) {
    return (
      <div className="m-4 rounded border border-slate-800 bg-slate-950/90 p-6 text-sm text-slate-300">
        Industrial poles are disabled by{" "}
        <span className="font-mono text-cyan-200/90">industrial_poles_enabled</span>.
      </div>
    );
  }

  const lowPower = lowBandwidth || lowAnimation;

  return (
    <AdaptiveWorkspaceLayout
      lowAnimation={lowAnimation}
      contextHeader={
        <ContextHeader
          entry={entry}
          connected={connected}
          aiSummary={aiSummary}
          activeZone="SN-DKR-01 / SN-THIES corridor"
          operationalAlerts={operationalAlerts}
          aiLoading={aiLoading && !bundle}
        />
      }
      canvas={
        <div className="flex h-full min-h-[320px] flex-col gap-2">
          <OperationalDensityRibbon />
          <div className="min-h-0 flex-1">
            <MapControlEngine
              lowPower={lowPower}
              zones={zonesRoutes.zones}
              routes={zonesRoutes.routes}
              emphasis={entry.mapEmphasis}
              mapLayersEnabled={flags.logistics_map_enabled !== false}
              commandFamilies={entry.mapCommandFamilies}
            />
          </div>
          {poleSlug === "marketing-activation" && marketingCanvas ? (
            <p className="text-[10px] text-amber-200/85" data-testid="marketing-canvas-source">
              {marketingCanvas.source === "marketing_activation_bundle"
                ? "Canvas: activation bundle opportunity map (live)."
                : "Canvas: demo-operational fallback — see detail below."}{" "}
              <span className="text-slate-500">{marketingCanvas.detail}</span>
            </p>
          ) : null}
          {poleSlug === "supply-logistics" && supplyCanvasMeta ? (
            <p className="text-[10px] text-cyan-200/85" data-testid="supply-canvas-source">
              {supplyCanvasMeta.source === "supply_logistics_bundle"
                ? "Canvas: supply-logistics bundle geometry (live)."
                : supplyCanvasMeta.source === "supply_logistics_api_fallback"
                  ? "Canvas: labeled demo-operational fallback — API unavailable or invalid bundle."
                  : "Canvas: empty state — no silent generic demo map (Instruction 15A)."}
              <span className="text-slate-500"> {supplyCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "finance-collections" && financeCanvasMeta ? (
            <p className="text-[10px] text-rose-200/85" data-testid="finance-canvas-source">
              {financeCanvasMeta.source === "finance_collections_bundle"
                ? "Canvas: finance-collections bundle pressure map (live)."
                : "Canvas: labeled demo-operational fallback — finance bundle unavailable."}
              <span className="text-slate-500"> {financeCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "data-intelligence" && dataIntelligenceCanvasMeta ? (
            <p className="text-[10px] text-cyan-200/85" data-testid="data-intelligence-canvas-source">
              {dataIntelligenceCanvasMeta.source === "data_intelligence_bundle"
                ? "Canvas: data-intelligence systemic map (live)."
                : "Canvas: labeled demo-operational fallback — bundle unavailable."}
              <span className="text-slate-500"> {dataIntelligenceCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "economic-propagation" && economicPropagationCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="economic-propagation-symbolic-projection"
            >
              {economicPropagationCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "economic-propagation" && economicPropagationCanvasMeta ? (
            <p className="text-[10px] text-violet-200/85" data-testid="economic-propagation-canvas-source">
              {economicPropagationCanvasMeta.source === "economic_propagation_bundle"
                ? "Canvas: propagation nervous-system map (live)."
                : "Canvas: labeled economic propagation demo fallback — not a silent generic map."}
              <span className="text-slate-500"> {economicPropagationCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "economic-memory" && economicMemoryCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="economic-memory-symbolic-projection-canvas"
            >
              {economicMemoryCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "economic-memory" && economicMemoryCanvasMeta ? (
            <p className="text-[10px] text-slate-200/85" data-testid="economic-memory-canvas-source">
              {economicMemoryCanvasMeta.source === "economic_memory_bundle"
                ? "Canvas: economic memory density map (live)."
                : "Canvas: labeled economic memory demo fallback — not silent geography."}
              <span className="text-slate-500"> {economicMemoryCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "economic-scenarios" && economicScenariosCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="economic-scenarios-symbolic-projection-canvas"
            >
              {economicScenariosCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "economic-scenarios" && economicScenariosCanvasMeta ? (
            <p className="text-[10px] text-violet-200/85" data-testid="economic-scenarios-canvas-source">
              {economicScenariosCanvasMeta.source === "economic_scenarios_bundle"
                ? "Canvas: scenario prospective lattice (live)."
                : "Canvas: labeled economic scenarios demo fallback — not silent geography."}
              <span className="text-slate-500"> {economicScenariosCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "economic-coordination" && economicCoordinationCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="economic-coordination-symbolic-projection-canvas"
            >
              {economicCoordinationCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "economic-coordination" && economicCoordinationCanvasMeta ? (
            <p className="text-[10px] text-cyan-200/85" data-testid="economic-coordination-canvas-source">
              {economicCoordinationCanvasMeta.source === "economic_coordination_bundle"
                ? "Canvas: coordination stress field (live)."
                : "Canvas: labeled economic coordination demo fallback — not silent geography."}
              <span className="text-slate-500"> {economicCoordinationCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "economic-command" && economicCommandCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="economic-command-symbolic-projection-canvas"
            >
              {economicCommandCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "economic-command" && economicCommandCanvasMeta ? (
            <p className="text-[10px] text-amber-200/85" data-testid="economic-command-canvas-source">
              {economicCommandCanvasMeta.source === "economic_command_bundle"
                ? "Canvas: command pressure / arbitration field (live)."
                : "Canvas: labeled economic command demo fallback — not silent geography."}
              <span className="text-slate-500"> {economicCommandCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "industrial-situation-room" && industrialSituationRoomCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="industrial-situation-room-symbolic-projection-canvas"
            >
              {industrialSituationRoomCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "industrial-situation-room" && industrialSituationRoomCanvasMeta ? (
            <p className="text-[10px] text-slate-200/85" data-testid="industrial-situation-room-canvas-source">
              {industrialSituationRoomCanvasMeta.source === "industrial_situation_room_bundle"
                ? "Canvas: situation cells / mission corridors (symbolic projection, live bundle)."
                : "Canvas: labeled industrial situation room fallback — not silent geography."}
              <span className="text-slate-500"> {industrialSituationRoomCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "industrial-operational-continuity" && industrialOperationalContinuityCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="industrial-operational-continuity-symbolic-projection-canvas"
            >
              {industrialOperationalContinuityCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "industrial-operational-continuity" && industrialOperationalContinuityCanvasMeta ? (
            <p className="text-[10px] text-emerald-200/85" data-testid="industrial-operational-continuity-canvas-source">
              {industrialOperationalContinuityCanvasMeta.source === "industrial_operational_continuity_bundle"
                ? "Canvas: stability states / continuity corridors (symbolic projection, live bundle)."
                : "Canvas: labeled industrial operational continuity fallback — not silent geography."}
              <span className="text-slate-500"> {industrialOperationalContinuityCanvasMeta.detail}</span>
            </p>
          ) : null}
          {poleSlug === "commercial-relationship-graph" && commercialRelationshipGraphCanvasMeta?.projectionLabelFr ? (
            <p
              className="text-[11px] font-medium text-amber-100/90"
              data-testid="commercial-relationship-graph-symbolic-projection-canvas"
            >
              {commercialRelationshipGraphCanvasMeta.projectionLabelFr}
            </p>
          ) : null}
          {poleSlug === "commercial-relationship-graph" && commercialRelationshipGraphCanvasMeta ? (
            <p className="text-[10px] text-cyan-200/85" data-testid="commercial-relationship-graph-canvas-source">
              {commercialRelationshipGraphCanvasMeta.source === "commercial_relationship_graph_bundle"
                ? "Canvas: lattice symbolique des relations validées (bundle live)."
                : "Canvas: état vide symbolique — bundle graphe indisponible ou politique DISABLED."}
              <span className="text-slate-500"> {commercialRelationshipGraphCanvasMeta.detail}</span>
            </p>
          ) : null}
          <p className="text-[10px] text-slate-500">
            Map commands armed: {entry.mapCommandFamilies.slice(0, 3).join(" · ")}…
          </p>
        </div>
      }
      actionRail={
        <ContextualActionRail
          lowBandwidth={lowBandwidth}
          lowAnimation={lowAnimation}
          onToggleBandwidth={setLowBandwidth}
          onToggleAnimation={setLowAnimation}
          onRefreshInsight={onRefreshInsight}
          aiRefreshing={aiLoading}
        />
      }
      signalStream={<SignalStream items={stream} demoMode={demoMode} liveChannel={liveChannel} />}
    />
  );
}
