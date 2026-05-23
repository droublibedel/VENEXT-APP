"use client";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import type { EconomicMemoryOrgResolution } from "./resolveEconomicMemoryOrganizationId";
import { useEconomicMemoryData } from "./useEconomicMemoryData";
import { CrisisSignatureSurface } from "./CrisisSignatureSurface";
import { EconomicRecurrenceSurface } from "./EconomicRecurrenceSurface";
import { EconomicTimelineSurface } from "./EconomicTimelineSurface";
import { PropagationHistorySurface } from "./PropagationHistorySurface";
import { TemporalVolatilitySurface } from "./TemporalVolatilitySurface";
import { TerritoryMemorySurface } from "./TerritoryMemorySurface";
import { EconomicMemoryRealtimeStrip } from "./EconomicMemoryRealtimeStrip";

type Props = {
  realtimeGateway: PoleRealtimeGateway;
  organizationResolution: EconomicMemoryOrgResolution;
};

export function EconomicMemoryWorkspace({ realtimeGateway, organizationResolution }: Props) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const enabled = flags.economic_memory_enabled !== false && hydrated;
  const { bundle, loading } = useEconomicMemoryData(organizationResolution.organizationId, enabled);

  if (!hydrated) {
    return <div className="p-4 text-xs text-slate-500">Loading feature flags…</div>;
  }

  if (!enabled) {
    return (
      <div className="m-4 rounded border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-300">
        Economic memory disabled by <span className="font-mono text-cyan-200/80">economic_memory_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 p-3">
      <EconomicMemoryRealtimeStrip demoMode={realtimeGateway.demoMode} />
      <div className="text-[11px] text-amber-100/90" data-testid="economic-memory-symbolic-projection">
        Projection historique symbolique — non géographique réelle
      </div>
      <div className="text-xs text-slate-400">
        Org: <span className="font-mono text-slate-200">{organizationResolution.organizationId}</span> · source{" "}
        <span className="text-slate-300">{organizationResolution.source}</span>
        {loading ? " · loading bundle…" : null}
      </div>
      {bundle?.headline ? <p className="text-sm text-slate-200">{bundle.headline}</p> : null}
      {bundle?.disclaimer ? <p className="text-[11px] text-slate-500">{bundle.disclaimer}</p> : null}
      <div className="grid gap-2 md:grid-cols-2">
        <EconomicTimelineSurface />
        <CrisisSignatureSurface />
        <PropagationHistorySurface />
        <TerritoryMemorySurface />
        <EconomicRecurrenceSurface />
        <TemporalVolatilitySurface />
      </div>
    </div>
  );
}
