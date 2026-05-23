"use client";

import type { RelationalEconomicCommandCenterOverviewDto, RelationalEconomicSystemicViewDto } from "@venext/shared-contracts";

export function SystemicOverviewSurface(props: {
  overview: RelationalEconomicCommandCenterOverviewDto | null;
  systemic: RelationalEconomicSystemicViewDto | null;
}) {
  const { overview, systemic } = props;
  const risk = systemic?.globalRiskScore ?? overview?.globalRiskScore ?? null;
  const health = systemic?.operationalHealthScore ?? overview?.operationalHealthScore ?? null;
  const pressure = systemic?.propagationHeat ?? overview?.systemicPressureScore ?? null;

  return (
    <div data-testid="relational-command-systemic-overview">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-indigo-200/90">Synthèse nerveuse corridor</p>
      <dl className="mt-2 grid gap-2 sm:grid-cols-3">
        <div className="rounded border border-indigo-900/40 bg-slate-950/70 px-2 py-1.5">
          <dt className="text-[8px] text-slate-500">Risque agrégé borné</dt>
          <dd className="font-mono text-[11px] text-indigo-200">{risk ?? "—"}</dd>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/70 px-2 py-1.5">
          <dt className="text-[8px] text-slate-500">Santé opérationnelle corridor</dt>
          <dd className="font-mono text-[11px] text-violet-100">{health ?? "—"}</dd>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/70 px-2 py-1.5">
          <dt className="text-[8px] text-slate-500">Chaleur propagation (graphe)</dt>
          <dd className="font-mono text-[11px] text-rose-200/90">{pressure ?? "—"}</dd>
        </div>
      </dl>
      {overview ? (
        <p className="mt-2 text-[8px] font-mono text-slate-600">
          corridors={overview.corridorCountUnderSupervision} critiques={overview.criticalCorridorCount} · calcul {overview.computedAt}
        </p>
      ) : null}
    </div>
  );
}
