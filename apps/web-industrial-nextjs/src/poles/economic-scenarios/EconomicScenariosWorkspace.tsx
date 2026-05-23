"use client";

import { useEffect, useState } from "react";
import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { PersistedScenarioAuditSurface } from "./PersistedScenarioAuditSurface";
import { ScenarioImpactsSurface } from "./ScenarioImpactsSurface";
import { ScenarioComparisonSurface } from "./ScenarioComparisonSurface";
import { ScenarioMemorySurface } from "./ScenarioMemorySurface";
import { ScenarioOverviewSurface } from "./ScenarioOverviewSurface";
import { ScenarioRiskSurface } from "./ScenarioRiskSurface";
import { ScenarioStabilizationSurface } from "./ScenarioStabilizationSurface";
import { ScenarioTrajectorySurface } from "./ScenarioTrajectorySurface";
import { EconomicScenariosRealtimeStrip } from "./EconomicScenariosRealtimeStrip";
import type { EconomicScenariosOrgResolution } from "./resolveEconomicScenariosOrganizationId";
import { useEconomicScenariosData } from "./useEconomicScenariosData";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";

export function EconomicScenariosWorkspace({
  organizationResolution,
  realtimeGateway,
}: {
  organizationResolution: EconomicScenariosOrgResolution;
  realtimeGateway: PoleRealtimeGateway;
}) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { bundle, loading, error } = useEconomicScenariosData(organizationResolution);
  const [showPersistedAudit, setShowPersistedAudit] = useState(() => {
    if (typeof navigator === "undefined") return true;
    const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return !(c && c.saveData);
  });

  useEffect(() => {
    if (showPersistedAudit) return;
    const id = window.setTimeout(() => setShowPersistedAudit(true), 2500);
    return () => clearTimeout(id);
  }, [showPersistedAudit]);
  const enabled = flags.economic_scenarios_enabled !== false && hydrated;

  if (!enabled) {
    return (
      <div className="m-4 rounded border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-300">
        Economic scenarios disabled by <span className="font-mono text-cyan-200/80">economic_scenarios_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <EconomicScenariosRealtimeStrip gateway={realtimeGateway} />
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
        org {organizationResolution.organizationId.slice(0, 8)}… · {organizationResolution.source}
        {loading ? " · loading" : ""}
        {error ? ` · ${error}` : ""}
      </div>
      <ScenarioOverviewSurface bundle={bundle} />
      {showPersistedAudit ? <PersistedScenarioAuditSurface organizationId={organizationResolution.organizationId} /> : null}
      <ScenarioTrajectorySurface bundle={bundle} />
      <ScenarioImpactsSurface bundle={bundle} />
      <ScenarioComparisonSurface bundle={bundle} />
      <ScenarioRiskSurface bundle={bundle} />
      <ScenarioStabilizationSurface bundle={bundle} />
      <ScenarioMemorySurface bundle={bundle} />
      {bundle?.briefing ? (
        <section className="rounded border border-violet-900/50 bg-violet-950/20 p-3 text-xs text-slate-200">
          <h3 className="mb-1 font-semibold text-violet-100">Briefing (MockAI)</h3>
          <p>{bundle.briefing.executiveSummary}</p>
          <p className="mt-1 text-slate-500">
            providerMode={bundle.briefing.providerMode ?? "—"} · realLLM={String(bundle.briefing.realLLMConnected)} ·
            mockContext={String(bundle.briefing.mockContextUsed)}
          </p>
        </section>
      ) : null}
    </div>
  );
}
