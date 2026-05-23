"use client";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";

import { EconomicArbitrationsSurface } from "./EconomicArbitrationsSurface";
import { EconomicCommandNarrativeSurface } from "./EconomicCommandNarrativeSurface";
import { EconomicCommandOverviewSurface } from "./EconomicCommandOverviewSurface";
import { EconomicCommandRealtimeStrip } from "./EconomicCommandRealtimeStrip";
import { EconomicDecisionRisksSurface } from "./EconomicDecisionRisksSurface";
import { EconomicPressureZonesSurface } from "./EconomicPressureZonesSurface";
import { EconomicSilentTensionsSurface } from "./EconomicSilentTensionsSurface";
import { EconomicSystemStressSurface } from "./EconomicSystemStressSurface";
import type { EconomicCommandOrgResolution } from "./resolveEconomicCommandOrganizationId";
import type { EconomicCommandRemoteData } from "./useEconomicCommandData";

export function EconomicCommandWorkspace({
  organizationResolution,
  realtimeGateway,
  commandData,
}: {
  organizationResolution: EconomicCommandOrgResolution;
  realtimeGateway: PoleRealtimeGateway;
  commandData: EconomicCommandRemoteData;
}) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { bundle, loading, error } = commandData;

  const enabled = flags.economic_command_enabled !== false && hydrated;

  if (!enabled) {
    return (
      <div className="m-4 rounded border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-300">
        Salle de commandement économique désactivée par{" "}
        <span className="font-mono text-amber-200/80">economic_command_enabled</span>.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {flags.economic_command_realtime_enabled !== false ? (
        <EconomicCommandRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="text-[10px] text-slate-500">
          Temps réel commande coupé par <span className="font-mono">economic_command_realtime_enabled</span>.
        </p>
      )}
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
        org {organizationResolution.organizationId.slice(0, 8)}… · {organizationResolution.source}
        {loading ? " · chargement bundle summary" : ""}
        {error && !bundle?.degraded ? ` · ${error}` : ""}
      </div>
      {bundle?.degraded ? (
        <div className="rounded border border-amber-800/70 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-100/95">
          <p className="font-semibold">Mode dégradé — données reconstruites depuis les vues partielles</p>
          {bundle.missingSlices?.length ? (
            <p className="mt-1 text-[10px] text-amber-200/80">
              Tranches manquantes ou invalides:{" "}
              <span className="font-mono text-amber-100/90">{bundle.missingSlices.join(", ")}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      <EconomicCommandOverviewSurface bundle={bundle} />
      <EconomicSystemStressSurface bundle={bundle} />
      <EconomicPressureZonesSurface bundle={bundle} />
      {flags.economic_command_risk_enabled !== false ? <EconomicDecisionRisksSurface bundle={bundle} /> : null}
      {flags.economic_command_arbitration_enabled !== false ? <EconomicArbitrationsSurface bundle={bundle} /> : null}
      {flags.economic_command_tension_enabled !== false ? <EconomicSilentTensionsSurface bundle={bundle} /> : null}
      <EconomicCommandNarrativeSurface bundle={bundle} />
      <p className="text-[10px] text-slate-500">
        Couche de lecture exécutive — cockpit industriel. Consultatif uniquement. Aucun agent autonome, aucune exécution
        métier, aucun mode conversationnel.
      </p>
    </div>
  );
}
