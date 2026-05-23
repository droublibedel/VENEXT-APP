"use client";

import type { PressureOverviewDto } from "@venext/shared-contracts";

export function PressureOverviewSurface(props: { overview: PressureOverviewDto | null }) {
  const o = props.overview;
  if (!o) {
    return <p className="text-[8px] text-slate-600">Vue pression indisponible.</p>;
  }
  return (
    <div className="space-y-2 font-mono text-[9px] text-amber-100/90" data-testid="pressure-overview-surface">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">Pression multi-axes corridor</p>
      <dl className="grid gap-1 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Saturation</dt>
          <dd>{o.saturationPressure}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Coordination</dt>
          <dd>{o.coordinationPressure}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Incidents</dt>
          <dd>{o.incidentPressure}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Orchestration</dt>
          <dd>{o.orchestrationPressure}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Propagation</dt>
          <dd>{o.propagationPressure}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Dépendances</dt>
          <dd>{o.dependencyPressure}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Pression systémique agrégée</dt>
          <dd className="text-amber-50">{o.systemicPressure}</dd>
        </div>
      </dl>
    </div>
  );
}
