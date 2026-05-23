"use client";

import type { RelationalEconomicSovereigntyOverviewDto } from "@venext/shared-contracts";
import { RelationalEconomicSovereigntyOverviewSchema } from "@venext/shared-contracts";
import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import {
  fetchSovereigntyCaptivityMap,
  fetchSovereigntyOverview,
  fetchSovereigntyResilienceAutonomy,
} from "./sovereignty-api";
import {
  SovereigntyAutonomySurface,
  SovereigntyExposureSurface,
  SovereigntyRecoverySurface,
} from "./sovereignty-surfaces";

export function RelationalEconomicSovereigntyPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  sovereigntyEnabled: boolean;
  realtimeEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const {
    organizationId,
    relationshipId,
    sovereigntyEnabled,
    realtimeEnabled,
    realtimeGateway = null,
    embedded = false,
  } = props;

  const [overview, setOverview] = useState<RelationalEconomicSovereigntyOverviewDto | null>(null);
  const [captiveCount, setCaptiveCount] = useState(0);
  const [selfRecovery, setSelfRecovery] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !sovereigntyEnabled || !relationshipId) {
      setOverview(null);
      setCaptiveCount(0);
      setSelfRecovery(0);
      return;
    }
    const [ov, cap, res] = await Promise.all([
      fetchSovereigntyOverview(organizationId, relationshipId),
      fetchSovereigntyCaptivityMap(organizationId, relationshipId),
      fetchSovereigntyResilienceAutonomy(organizationId, relationshipId),
    ]);
    if (ov.ok) {
      const p = RelationalEconomicSovereigntyOverviewSchema.safeParse(ov.data);
      setOverview(p.success ? p.data : null);
    } else setOverview(null);
    if (cap.ok && typeof cap.data === "object" && cap.data && "captiveCorridors" in cap.data) {
      setCaptiveCount(
        Array.isArray((cap.data as { captiveCorridors: unknown }).captiveCorridors)
          ? (cap.data as { captiveCorridors: unknown[] }).captiveCorridors.length
          : 0,
      );
    } else setCaptiveCount(0);
    if (res.ok && typeof res.data === "object" && res.data && "corridorSelfRecoveryProbability" in res.data) {
      setSelfRecovery(
        typeof (res.data as { corridorSelfRecoveryProbability: unknown }).corridorSelfRecoveryProbability ===
          "number"
          ? (res.data as { corridorSelfRecoveryProbability: number }).corridorSelfRecoveryProbability
          : 0,
      );
    } else setSelfRecovery(0);
  }, [organizationId, relationshipId, sovereigntyEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  const sovereigntyEvents = (realtimeGateway?.stream ?? []).filter(
    (i) => i.relationalEconomicSovereigntyEnvelope,
  );
  const lastEventLabel = sovereigntyEvents[0]?.relationalEconomicSovereigntyEnvelope ?? null;
  const syncMode: "live" | "fallback" =
    realtimeEnabled && realtimeGateway?.connected ? "live" : "fallback";

  if (!sovereigntyEnabled) {
    return (
      <p className="px-2 py-3 text-[9px] text-slate-500" data-testid="relational-economic-sovereignty-disabled">
        Souveraineté économique désactivée (<span className="font-mono">relational_economic_sovereignty_enabled</span>).
      </p>
    );
  }

  return (
    <div
      className={
        embedded
          ? "mt-3 space-y-2 border-t border-slate-700/40 pt-3"
          : "space-y-2 rounded-lg border border-slate-700/50 bg-gradient-to-b from-slate-900/50 to-slate-950/60 p-3"
      }
      data-testid={embedded ? undefined : "relational-economic-sovereignty-panel"}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-200/95">
            Souveraineté & autonomie économique
          </p>
          <p className="text-[8px] text-slate-400/80">
            Autonomie corridor, dépendances critiques, captivité — pas ERP, pas scoring public, pas GPS.
          </p>
        </div>
        <p className="text-[8px] font-mono text-slate-300/70">
          {syncMode === "live" ? "live" : "fallback"}
          {lastEventLabel ? ` · ${lastEventLabel}` : ""}
        </p>
      </header>
      <div className="grid gap-2 md:grid-cols-3">
        <SovereigntyAutonomySurface
          sovereigntyScore={overview?.sovereigntyScore ?? 0}
          autonomyScore={overview?.autonomyScore ?? 0}
        />
        <SovereigntyExposureSurface
          dependencyExposure={overview?.dependencyExposureScore ?? 0}
          captivityRisk={overview?.systemicAutonomyRisk ?? 0}
        />
        <SovereigntyRecoverySurface
          selfRecoveryProbability={overview?.corridorSelfRecoveryProbability ?? selfRecovery}
        />
      </div>
      {captiveCount > 0 ? (
        <p className="text-[8px] text-amber-200/80">Corridors captifs détectés : {captiveCount}</p>
      ) : null}
    </div>
  );
}
