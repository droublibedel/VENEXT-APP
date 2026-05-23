"use client";

import { useMemo } from "react";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { RelationshipGraphRealtimeStrip } from "./RelationshipGraphRealtimeStrip";
import { RelationshipGraphWorkspace } from "./RelationshipGraphWorkspace";
import { resolveCommercialRelationshipGraphOrganizationId } from "./resolveCommercialRelationshipGraphOrganizationId";
import { useCommercialRelationshipGraphData } from "./useCommercialRelationshipGraphData";

const SLUG = "commercial-relationship-graph" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveCommercialRelationshipGraphOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.commercial_relationship_graph_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const graphData = useCommercialRelationshipGraphData(org.organizationId);
  const commercialRelationshipGraphCanvasHydration = useMemo(
    () => ({
      bundle: graphData.bundle,
      loading: graphData.loading,
      error: graphData.error,
    }),
    [graphData.bundle, graphData.loading, graphData.error],
  );

  return (
    <div className="flex min-h-0 flex-col">
      {flags.commercial_relationship_graph_realtime_enabled !== false ? (
        <RelationshipGraphRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par{" "}
          <span className="font-mono">commercial_relationship_graph_realtime_enabled</span>.
        </p>
      )}
      <RelationshipGraphWorkspace bundle={graphData.bundle} loading={graphData.loading} error={graphData.error} />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        commercialRelationshipGraphOrganizationId={org.organizationId}
        commercialRelationshipGraphCanvasHydration={commercialRelationshipGraphCanvasHydration}
      />
    </div>
  );
}
