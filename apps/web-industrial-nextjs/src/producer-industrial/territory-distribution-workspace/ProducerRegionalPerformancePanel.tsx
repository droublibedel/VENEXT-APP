"use client";

import { memo } from "react";

import type { ProducerTerritoryWorkspaceView, TerritoryPanelProps } from "./producer-territory.types";
import { ProducerTerritoryPanelFrame } from "./ProducerTerritoryPanelFrame";

function RegionalPerformanceInner(
  props: TerritoryPanelProps & { view: ProducerTerritoryWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const regions = view?.regions ?? [];

  return (
    <ProducerTerritoryPanelFrame
      title="Performance régionale"
      subtitle="Nord, Sud, Centre, Ouest — croissance et tension distribution"
      loading={loading}
      error={error}
      empty={!regions.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-regional-performance-panel"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {regions.map((r) => (
          <li
            key={r.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-3"
            data-testid={`territory-region-${r.id}`}
          >
            <p className="text-sm font-semibold text-slate-100">{r.region}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <dt>Croissance</dt>
              <dd className="font-mono text-emerald-400/90">+{r.growthPct.toFixed(1)}%</dd>
              <dt>Activité</dt>
              <dd className="font-mono text-slate-200">{r.activity}</dd>
              <dt>Disponibilité</dt>
              <dd>{r.availability}</dd>
              <dt>Stabilité</dt>
              <dd className="font-mono">{r.stability}%</dd>
              <dt>Tension</dt>
              <dd className="col-span-2 text-slate-300">{r.tension}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </ProducerTerritoryPanelFrame>
  );
}

export const ProducerRegionalPerformancePanel = memo(RegionalPerformanceInner);
