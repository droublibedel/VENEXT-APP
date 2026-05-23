"use client";

import type {
  RelationalSupplyFlowOverviewDto,
  RelationalSupplyFlowPressureOverviewDto,
  RelationalSupplyFlowPropagationDto,
} from "@venext/shared-contracts";
import {
  RelationalSupplyFlowOverviewSchema,
  RelationalSupplyFlowPressureOverviewSchema,
  RelationalSupplyFlowPropagationSchema,
} from "@venext/shared-contracts";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import {
  fetchSupplyFlowBottlenecks,
  fetchSupplyFlowCriticalFlows,
  fetchSupplyFlowDependencyMap,
  fetchSupplyFlowOverview,
  fetchSupplyFlowPressureOverview,
  fetchSupplyFlowPropagationMap,
} from "./supply-flow-api";
import { BottleneckSurface } from "./surfaces/BottleneckSurface";
import { CriticalFlowsSurface } from "./surfaces/CriticalFlowsSurface";
import { DependencySurface } from "./surfaces/DependencySurface";
import { FlowPressureSurface } from "./surfaces/FlowPressureSurface";
import { PropagationSurface } from "./surfaces/PropagationSurface";
import { RealtimeStrip } from "./surfaces/RealtimeStrip";
import { SupplyFlowOverviewSurface } from "./surfaces/SupplyFlowOverviewSurface";

export function RelationalSupplyFlowPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  supplyFlowEnabled: boolean;
  realtimeEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const {
    organizationId,
    relationshipId,
    supplyFlowEnabled,
    realtimeEnabled,
    realtimeGateway = null,
    embedded = false,
  } = props;

  const [overview, setOverview] = useState<RelationalSupplyFlowOverviewDto | null>(null);
  const [pressure, setPressure] = useState<RelationalSupplyFlowPressureOverviewDto | null>(null);
  const [propagation, setPropagation] = useState<RelationalSupplyFlowPropagationDto | null>(null);
  const [bottleneckCount, setBottleneckCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [depEdges, setDepEdges] = useState(0);
  const [systemicWeight, setSystemicWeight] = useState(0);
  const [lastLocalRefresh, setLastLocalRefresh] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!organizationId || !supplyFlowEnabled || !relationshipId) {
      setOverview(null);
      setPressure(null);
      setPropagation(null);
      setBottleneckCount(0);
      setCriticalCount(0);
      setDepEdges(0);
      setSystemicWeight(0);
      return;
    }
    const [ov, pr, prop, bn, cr, dep] = await Promise.all([
      fetchSupplyFlowOverview(organizationId, relationshipId),
      fetchSupplyFlowPressureOverview(organizationId, relationshipId),
      fetchSupplyFlowPropagationMap(organizationId, relationshipId),
      fetchSupplyFlowBottlenecks(organizationId, relationshipId),
      fetchSupplyFlowCriticalFlows(organizationId, relationshipId),
      fetchSupplyFlowDependencyMap(organizationId, relationshipId),
    ]);
    if (ov.ok) {
      const p = RelationalSupplyFlowOverviewSchema.safeParse(ov.data);
      setOverview(p.success ? p.data : null);
    } else setOverview(null);
    if (pr.ok) {
      const p = RelationalSupplyFlowPressureOverviewSchema.safeParse(pr.data);
      setPressure(p.success ? p.data : null);
    } else setPressure(null);
    if (prop.ok) {
      const p = RelationalSupplyFlowPropagationSchema.safeParse(prop.data);
      setPropagation(p.success ? p.data : null);
    } else setPropagation(null);
    if (bn.ok && typeof bn.data === "object" && bn.data && "bottlenecks" in bn.data) {
      setBottleneckCount(Array.isArray((bn.data as { bottlenecks: unknown }).bottlenecks) ? (bn.data as { bottlenecks: unknown[] }).bottlenecks.length : 0);
    } else setBottleneckCount(0);
    if (cr.ok && typeof cr.data === "object" && cr.data && "criticalFlows" in cr.data) {
      setCriticalCount(
        Array.isArray((cr.data as { criticalFlows: unknown }).criticalFlows)
          ? (cr.data as { criticalFlows: unknown[] }).criticalFlows.length
          : 0,
      );
    } else setCriticalCount(0);
    if (dep.ok && typeof dep.data === "object" && dep.data) {
      const d = dep.data as { edges?: unknown[]; systemicWeight?: number };
      setDepEdges(Array.isArray(d.edges) ? d.edges.length : 0);
      setSystemicWeight(typeof d.systemicWeight === "number" ? d.systemicWeight : 0);
    } else {
      setDepEdges(0);
      setSystemicWeight(0);
    }
    setLastLocalRefresh(new Date().toISOString());
  }, [organizationId, relationshipId, supplyFlowEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  const supplyEvents = useMemo(
    () => (realtimeGateway?.stream ?? []).filter((i) => i.relationalSupplyFlowEnvelope),
    [realtimeGateway?.stream],
  );
  const lastEventLabel = supplyEvents[0]?.relationalSupplyFlowEnvelope ?? null;
  const syncMode: "live" | "fallback" =
    realtimeEnabled && realtimeGateway?.connected ? "live" : "fallback";

  if (!supplyFlowEnabled) {
    return (
      <p className="px-2 py-3 text-[9px] text-slate-500" data-testid="relational-supply-flow-disabled">
        Intelligence supply-flow désactivée (<span className="font-mono">relational_supply_flow_enabled</span>).
      </p>
    );
  }

  return (
    <div
      className={
        embedded
          ? "mt-3 space-y-2 border-t border-orange-900/35 pt-3"
          : "space-y-2 rounded-lg border border-orange-900/40 bg-gradient-to-b from-orange-950/40 to-slate-950/60 p-3"
      }
      data-testid={embedded ? undefined : "relational-supply-flow-panel"}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-200/95">
            Supply flow intelligence
          </p>
          <p className="text-[8px] text-orange-100/55">
            Lecture corridor des flux économiques — pas TMS/WMS, pas tracking colis, pas GPS.
          </p>
        </div>
        <RealtimeStrip
          enabled={realtimeEnabled}
          syncMode={syncMode}
          lastLabel={lastEventLabel}
          lastUpdatedAt={lastLocalRefresh}
        />
      </header>
      <div className="grid gap-2 md:grid-cols-2">
        <SupplyFlowOverviewSurface
          title="Vue agrégée"
          nodeCount={overview?.nodes.length ?? 0}
          edgeCount={overview?.edges.length ?? 0}
          diagnostics={overview?.overviewDiagnostics ?? null}
        />
        <FlowPressureSurface
          flowPressure={pressure?.flowPressure ?? 0}
          continuityPressure={pressure?.continuityPressure ?? 0}
        />
        <BottleneckSurface count={bottleneckCount} />
        <CriticalFlowsSurface count={criticalCount} />
        <DependencySurface edgeCount={depEdges} systemicWeight={systemicWeight} />
        <PropagationSurface
          maxDepth={propagation?.maxDepthObserved ?? 0}
          chainCount={propagation?.cascadePaths.length ?? 0}
        />
      </div>
    </div>
  );
}
