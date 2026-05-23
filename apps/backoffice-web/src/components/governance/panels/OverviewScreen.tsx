"use client";

import { useGovernanceShell } from "../context/GovernanceShellContext";
import { DebugPayloadDrawer } from "../ui/DebugPayloadDrawer";
import { NetworkVitalityPanel } from "./overview/NetworkVitalityPanel";
import { SignalIntegrityPanel } from "./overview/SignalIntegrityPanel";
import { FeatureSurfaceStatusPanel } from "./overview/FeatureSurfaceStatusPanel";
import { EconomicSignalFlowPanel } from "./overview/EconomicSignalFlowPanel";
import { ModuleRiskStatePanel } from "./overview/ModuleRiskStatePanel";
import { DataQualitySummaryPanel } from "./overview/DataQualitySummaryPanel";

export function OverviewScreen() {
  const { overview, degraded } = useGovernanceShell();
  const o = overview as Record<string, unknown> | null;

  if (!o && degraded) {
    return <p className="text-[13px] text-[#FFC107]">Telemetry unavailable — check core proxy and credentials.</p>;
  }
  if (!o) {
    return <p className="text-[13px] text-white/50">Loading command overview…</p>;
  }

  const nv = o.networkVitality as Record<string, unknown> | undefined;
  const si = o.signalIntegrity as {
    economicSignalsLast24h?: number;
    dataQualityHighSeverity?: number;
    dataQualityCodes?: string[];
  } | undefined;
  const fs = o.featureSurfaceStatus as Record<string, unknown> | undefined;
  const es = o.economicSignalFlow as Record<string, unknown> | undefined;
  const mr = o.moduleRiskState as Record<string, unknown> | undefined;

  const rel = nv?.relationshipExpansion as Record<string, number> | undefined;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">System overview</h2>
        <p className="text-[12px] text-white/55">Network vitality, signal integrity, feature surface, economic flow, module risk.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <NetworkVitalityPanel
          activeOrganizations={nv?.activeOrganizations}
          governanceSuspendedOrgs={nv?.governanceSuspendedOrgs}
          relationshipExpansion={rel}
        />

        <SignalIntegrityPanel
          economicSignalsLast24h={si?.economicSignalsLast24h}
          dataQualityHighSeverity={si?.dataQualityHighSeverity}
        />

        <FeatureSurfaceStatusPanel globalEnabledFlagRows={fs?.globalEnabledFlagRows} />

        <EconomicSignalFlowPanel windowHours={es?.windowHours} count={es?.count} />

        <ModuleRiskStatePanel highFindings={mr?.highFindings} totalFindings={mr?.totalFindings} />

        <DataQualitySummaryPanel dataQualityCodes={si?.dataQualityCodes} />
      </div>

      <DebugPayloadDrawer label="overview response" data={o} />
    </div>
  );
}
