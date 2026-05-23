"use client";

import type { RelationalEconomicContinuityOverviewDto } from "@venext/shared-contracts";
import { RelationalEconomicContinuityOverviewSchema } from "@venext/shared-contracts";
import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import {
  fetchContinuityInstabilityMap,
  fetchContinuityOverview,
  fetchContinuitySystemicPressure,
} from "./continuity-api";
import {
  ContinuityPressureSurface,
  ContinuityRecoverySurface,
  ContinuityStabilitySurface,
} from "./continuity-surfaces";

export function RelationalEconomicContinuityPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  continuityEnabled: boolean;
  realtimeEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const {
    organizationId,
    relationshipId,
    continuityEnabled,
    realtimeEnabled,
    realtimeGateway = null,
    embedded = false,
  } = props;

  const [overview, setOverview] = useState<RelationalEconomicContinuityOverviewDto | null>(null);
  const [unstableCount, setUnstableCount] = useState(0);
  const [continuityPressure, setContinuityPressure] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !continuityEnabled || !relationshipId) {
      setOverview(null);
      setUnstableCount(0);
      setContinuityPressure(0);
      return;
    }
    const [ov, inst, pressure] = await Promise.all([
      fetchContinuityOverview(organizationId, relationshipId),
      fetchContinuityInstabilityMap(organizationId, relationshipId),
      fetchContinuitySystemicPressure(organizationId, relationshipId),
    ]);
    if (ov.ok) {
      const p = RelationalEconomicContinuityOverviewSchema.safeParse(ov.data);
      setOverview(p.success ? p.data : null);
    } else setOverview(null);
    if (inst.ok && typeof inst.data === "object" && inst.data && "unstableZones" in inst.data) {
      setUnstableCount(
        Array.isArray((inst.data as { unstableZones: unknown }).unstableZones)
          ? (inst.data as { unstableZones: unknown[] }).unstableZones.length
          : 0,
      );
    } else setUnstableCount(0);
    if (pressure.ok && typeof pressure.data === "object" && pressure.data && "continuityPressure" in pressure.data) {
      setContinuityPressure(
        typeof (pressure.data as { continuityPressure: unknown }).continuityPressure === "number"
          ? (pressure.data as { continuityPressure: number }).continuityPressure
          : 0,
      );
    } else setContinuityPressure(0);
  }, [organizationId, relationshipId, continuityEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  const continuityEvents = (realtimeGateway?.stream ?? []).filter((i) => i.relationalEconomicContinuityEnvelope);
  const lastEventLabel = continuityEvents[0]?.relationalEconomicContinuityEnvelope ?? null;
  const syncMode: "live" | "fallback" =
    realtimeEnabled && realtimeGateway?.connected ? "live" : "fallback";

  const diag = overview?.overviewDiagnostics;
  const qualityLabel =
    diag == null
      ? "—"
      : diag.heuristicFallbackUsed
        ? "Partiellement dérivé (fallback explicite)"
        : "Continuité multi-couches (macro + historique)";

  if (!continuityEnabled) {
    return (
      <p className="px-2 py-3 text-[9px] text-slate-500" data-testid="relational-economic-continuity-disabled">
        Continuité économique désactivée (<span className="font-mono">relational_economic_continuity_enabled</span>).
      </p>
    );
  }

  return (
    <div
      className={
        embedded
          ? "mt-3 space-y-2 border-t border-teal-900/35 pt-3"
          : "space-y-2 rounded-lg border border-teal-900/40 bg-gradient-to-b from-teal-950/40 to-slate-950/60 p-3"
      }
      data-testid={embedded ? undefined : "relational-economic-continuity-panel"}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-200/95">
            Stabilité & continuité économique
          </p>
          <p className="text-[8px] text-teal-100/55">
            Continuité corridor, instabilité longue durée, récupération bornée — pas ERP, pas autopilot, pas GPS.
          </p>
        </div>
        <p className="text-[8px] font-mono text-teal-200/70">
          {syncMode === "live" ? "live" : "fallback"}
          {lastEventLabel ? ` · ${lastEventLabel}` : ""}
        </p>
      </header>
      <div className="grid gap-2 md:grid-cols-3">
        <ContinuityStabilitySurface
          continuityScore={overview?.continuityScore ?? 0}
          economicStability={overview?.economicStability ?? 0}
        />
        <ContinuityPressureSurface
          instabilityRisk={overview?.instabilityRisk ?? 0}
          systemicRisk={overview?.systemicContinuityRisk ?? continuityPressure}
        />
        <ContinuityRecoverySurface recoveryProbability={overview?.recoveryProbability ?? 0} />
      </div>
      <p className="text-[8px] text-teal-100/60">
        Qualité : {qualityLabel}
        {unstableCount > 0 ? ` · zones instables ${unstableCount}` : ""}
      </p>
    </div>
  );
}
