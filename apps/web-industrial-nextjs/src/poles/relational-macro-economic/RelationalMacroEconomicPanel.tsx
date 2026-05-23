"use client";

import type { RelationalMacroEconomicResilienceOverviewDto } from "@venext/shared-contracts";
import { RelationalMacroEconomicResilienceOverviewSchema } from "@venext/shared-contracts";
import { useCallback, useEffect, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { fetchMacroFragilityMap, fetchMacroResilienceOverview, fetchMacroSystemicPressure } from "./macro-economic-api";

export function RelationalMacroEconomicPanel(props: {
  organizationId: string | null;
  relationshipId?: string | null;
  macroEnabled: boolean;
  realtimeEnabled: boolean;
  realtimeGateway?: PoleRealtimeGateway | null;
  embedded?: boolean;
}) {
  const { organizationId, relationshipId, macroEnabled, realtimeEnabled, realtimeGateway = null, embedded = false } =
    props;

  const [overview, setOverview] = useState<RelationalMacroEconomicResilienceOverviewDto | null>(null);
  const [fragileCount, setFragileCount] = useState(0);
  const [systemicPressure, setSystemicPressure] = useState(0);

  const reload = useCallback(async () => {
    if (!organizationId || !macroEnabled || !relationshipId) {
      setOverview(null);
      setFragileCount(0);
      setSystemicPressure(0);
      return;
    }
    const [ov, frag, pressure] = await Promise.all([
      fetchMacroResilienceOverview(organizationId, relationshipId),
      fetchMacroFragilityMap(organizationId, relationshipId),
      fetchMacroSystemicPressure(organizationId, relationshipId),
    ]);
    if (ov.ok) {
      const p = RelationalMacroEconomicResilienceOverviewSchema.safeParse(ov.data);
      setOverview(p.success ? p.data : null);
    } else setOverview(null);
    if (frag.ok && typeof frag.data === "object" && frag.data && "fragileZones" in frag.data) {
      setFragileCount(
        Array.isArray((frag.data as { fragileZones: unknown }).fragileZones)
          ? (frag.data as { fragileZones: unknown[] }).fragileZones.length
          : 0,
      );
    } else setFragileCount(0);
    if (pressure.ok && typeof pressure.data === "object" && pressure.data && "systemicPressure" in pressure.data) {
      setSystemicPressure(
        typeof (pressure.data as { systemicPressure: unknown }).systemicPressure === "number"
          ? (pressure.data as { systemicPressure: number }).systemicPressure
          : 0,
      );
    } else setSystemicPressure(0);
  }, [organizationId, relationshipId, macroEnabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtimeGateway?.connected) return;
    const h = window.setTimeout(() => void reload(), 320);
    return () => window.clearTimeout(h);
  }, [realtimeGateway?.stream, realtimeGateway?.connected, reload]);

  const macroEvents = (realtimeGateway?.stream ?? []).filter((i) => i.relationalMacroEconomicEnvelope);
  const lastEventLabel = macroEvents[0]?.relationalMacroEconomicEnvelope ?? null;
  const syncMode: "live" | "fallback" =
    realtimeEnabled && realtimeGateway?.connected ? "live" : "fallback";

  const diag = overview?.overviewDiagnostics;
  const qualityLabel =
    diag == null
      ? "—"
      : diag.heuristicFallbackUsed
        ? "Partiellement dérivé (fallback explicite)"
        : "Agrégé multi-couches (corridor)";

  if (!macroEnabled) {
    return (
      <p className="px-2 py-3 text-[9px] text-slate-500" data-testid="relational-macro-economic-disabled">
        Intelligence macro-économique désactivée (<span className="font-mono">relational_macro_economic_enabled</span>).
      </p>
    );
  }

  return (
    <div
      className={
        embedded
          ? "mt-3 space-y-2 border-t border-violet-900/35 pt-3"
          : "space-y-2 rounded-lg border border-violet-900/40 bg-gradient-to-b from-violet-950/40 to-slate-950/60 p-3"
      }
      data-testid={embedded ? undefined : "relational-macro-economic-panel"}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-200/95">
            Macro-economic resilience
          </p>
          <p className="text-[8px] text-violet-100/55">
            Résilience corridor, fragilité systémique, propagation bornée — pas ERP, pas GPS, pas wallet.
          </p>
        </div>
        <p className="text-[8px] font-mono text-violet-200/70">
          {syncMode === "live" ? "live" : "fallback"}
          {lastEventLabel ? ` · ${lastEventLabel}` : ""}
        </p>
      </header>
      <div className="grid gap-2 md:grid-cols-3">
        <section className="rounded border border-violet-900/40 bg-violet-950/20 p-2">
          <h4 className="text-[9px] font-semibold uppercase text-violet-200/90">Résilience</h4>
          <p className="mt-1 font-mono text-lg text-violet-100">{overview?.resilienceScore ?? "—"}</p>
          <p className="text-[8px] text-violet-100/60">Risque macro {overview?.macroEconomicRisk ?? "—"}</p>
        </section>
        <section className="rounded border border-violet-900/40 bg-violet-950/20 p-2">
          <h4 className="text-[9px] font-semibold uppercase text-violet-200/90">Pression systémique</h4>
          <p className="mt-1 font-mono text-lg text-violet-100">{systemicPressure || overview?.systemicPressure || "—"}</p>
          <p className="text-[8px] text-violet-100/60">Zones fragiles {fragileCount}</p>
        </section>
        <section className="rounded border border-violet-900/40 bg-violet-950/20 p-2">
          <h4 className="text-[9px] font-semibold uppercase text-violet-200/90">Qualité lecture</h4>
          <p className="mt-1 text-[8px] text-violet-100/75">{qualityLabel}</p>
          {diag && diag.fallbackReasons.length > 0 ? (
            <p className="mt-1 text-[7px] text-amber-200/90">{diag.fallbackReasons.slice(0, 3).join(" · ")}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
