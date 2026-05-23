"use client";

import { VenextPanelSkeleton } from "@/ux/VenextPanelSkeleton";

import { useEffect, useMemo, useState } from "react";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useAdaptiveQualityMode } from "../performance/adaptive-quality";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { EconomicPropagationRealtimeStrip } from "./EconomicPropagationRealtimeStrip";
import { useEconomicPropagationData } from "./useEconomicPropagationData";
import type { EconomicPropagationOrgResolution } from "./resolveEconomicPropagationOrganizationId";
import type {
  EconomicPropagationChain,
  EconomicPropagationOverview,
  EconomicShock,
  PropagationSimulation,
  TerritoryFragility,
} from "@venext/shared-contracts";


export function PropagationOverview({ overview, degraded }: { overview?: EconomicPropagationOverview; degraded: boolean }) {
  if (!overview) return <VenextPanelSkeleton tall />;
  return (
    <section className="rounded border border-violet-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/30 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-violet-200/80">Propagation overview</p>
      <p className="mt-1 text-sm text-slate-100">{overview.headline}</p>
      <p className="mt-1 font-mono text-[11px] text-cyan-100/80">
        systemicRiskRollup {overview.systemicRiskRollup.toFixed(3)} · shocks {overview.shockCount} · chains {overview.chainCount}
      </p>
      {degraded ? (
        <p className="mt-1 text-[10px] text-amber-200/90">Degraded load — sequential endpoints; bundle partial.</p>
      ) : null}
    </section>
  );
}

export function EconomicShockRadar({ shocks }: { shocks?: EconomicShock[] }) {
  if (!shocks) return <VenextPanelSkeleton tall />;
  return (
    <section className="rounded border border-rose-900/40 bg-slate-950/80 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-rose-200/80">Shock radar</p>
      <ul className="mt-2 space-y-2">
        {shocks.slice(0, 8).map((s) => (
          <li key={s.id} className="border-l-2 border-rose-500/60 pl-2">
            <p className="text-[11px] font-semibold text-slate-100">
              {s.type}{" "}
              <span className="font-mono text-[10px] text-rose-200/90">
                sev {s.severity} · sys {s.systemicRisk.toFixed(2)}
              </span>
            </p>
            <p className="text-[10px] text-slate-400">{s.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PropagationChainSurface({ chains }: { chains?: EconomicPropagationChain[] }) {
  if (!chains) return <VenextPanelSkeleton tall />;
  return (
    <section className="rounded border border-cyan-900/40 bg-slate-950/80 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Propagation chains</p>
      <ul className="mt-2 space-y-2">
        {chains.slice(0, 6).map((c) => (
          <li key={c.chainId} className="rounded border border-cyan-800/30 bg-black/30 px-2 py-1.5">
            <p className="font-mono text-[10px] text-cyan-100/90">
              {c.chainId} · depth {c.propagationDepth} · risk {c.systemicRiskScore.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400">{c.impacts.map((i) => `${i.targetPole}:${i.impactType}`).join(" → ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TerritoryFragilitySurface({ rows }: { rows?: TerritoryFragility[] }) {
  if (!rows) return <VenextPanelSkeleton tall />;
  return (
    <section className="rounded border border-amber-900/40 bg-slate-950/80 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Territory fragility</p>
      <ul className="mt-2 space-y-1.5">
        {rows.slice(0, 8).map((r) => (
          <li key={r.territory} className="flex justify-between gap-2 text-[11px] text-slate-200">
            <span className="font-mono text-[10px] text-amber-100/90">{r.territory}</span>
            <span className="text-amber-200/90">frag {r.fragilityScore.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PropagationSimulationSurface({ sim }: { sim?: PropagationSimulation }) {
  if (!sim) return <VenextPanelSkeleton tall />;
  return (
    <section className="rounded border border-emerald-900/40 bg-slate-950/80 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-emerald-200/80">Simulation preview</p>
      <p className="mt-1 font-mono text-[11px] text-emerald-100/90">
        {sim.simulationId} · {sim.triggerType} · sys {sim.systemicRiskScore.toFixed(2)}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">{sim.predictedEscalation}</p>
    </section>
  );
}

export function PropagationInterventionQueue({ chains }: { chains?: EconomicPropagationChain[] }) {
  if (!chains?.length) return <VenextPanelSkeleton />;
  const head = chains[0]!;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/90 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-400">Intervention queue</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-slate-200">
        {head.recommendedInterventions.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ol>
    </section>
  );
}

type Props = { realtimeGateway: PoleRealtimeGateway; organizationResolution: EconomicPropagationOrgResolution };

export function EconomicPropagationWorkspace({ realtimeGateway, organizationResolution }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { lowBandwidth, lowAnimation } = useAdaptiveQualityMode();
  const enabled = flags.economic_propagation_enabled !== false;
  const { bundle, loading, hydratedVia } = useEconomicPropagationData(
    organizationResolution.organizationId,
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
    const t = window.setTimeout(() => setHeavyVisible(true), 1400);
    return () => window.clearTimeout(t);
  }, [lowPower]);

  const ov = bundle.overview as EconomicPropagationOverview | undefined;
  const sh = bundle.shocks as EconomicShock[] | undefined;
  const ch = bundle.chains as EconomicPropagationChain[] | undefined;
  const tf = bundle.territoryFragility as TerritoryFragility[] | undefined;
  const sim = bundle.simulationPreview as PropagationSimulation | undefined;
  const degraded = hydratedVia === "sequential";

  if (!hydrated) {
    return <p className="px-2 text-xs text-slate-500">Hydrating industrial policies…</p>;
  }

  if (!enabled) {
    return (
      <div className="m-2 rounded border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-400">
        Economic propagation disabled by <span className="font-mono text-violet-200/80">economic_propagation_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-2 px-2 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200/80">
          Economic propagation ·{" "}
          {organizationResolution.source === "demo_fallback" ? (
            <span className="text-amber-200/90">demo org fallback</span>
          ) : (
            <span className="text-slate-400">explicit org</span>
          )}
        </p>
        {rtEnabled ? (
          <EconomicPropagationRealtimeStrip
            connected={realtimeGateway.connected}
            demoMode={realtimeGateway.demoMode}
            liveChannel={realtimeGateway.liveChannel}
            latest={latestSignal}
          />
        ) : null}
      </div>
      {loading ? <VenextPanelSkeleton tall /> : null}
      <PropagationOverview overview={ov} degraded={degraded} />
      {heavyVisible ? (
        <div className="grid gap-2 md:grid-cols-2">
          <EconomicShockRadar shocks={sh} />
          <PropagationChainSurface chains={ch} />
          <TerritoryFragilitySurface rows={tf} />
          <PropagationSimulationSurface sim={sim} />
        </div>
      ) : (
        <p className="text-[10px] text-slate-500">Low bandwidth — deferring shock / chain lattice…</p>
      )}
      <PropagationInterventionQueue chains={ch} />
    </div>
  );
}
