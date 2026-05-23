"use client";

import { memo } from "react";

import type { ProducerTerritoryWorkspaceView, TerritoryPanelProps } from "./producer-territory.types";
import { ProducerTerritoryPanelFrame } from "./ProducerTerritoryPanelFrame";

function TerritoryActivityInner(
  props: TerritoryPanelProps & { view: ProducerTerritoryWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const cities = view?.cityActivity ?? [];

  return (
    <ProducerTerritoryPanelFrame
      title="Activité territoriale"
      subtitle="Villes dynamiques, commandes et croissance locale"
      loading={loading}
      error={error}
      empty={!cities.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-territory-activity-panel"
    >
      <ul className="space-y-2">
        {cities.map((c) => (
          <li
            key={c.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2"
            data-testid={`territory-city-${c.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-100">{c.city}</p>
              <span
                className={`rounded px-2 py-0.5 text-[10px] capitalize ${
                  c.trend === "hausse"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : c.trend === "baisse"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-slate-800 text-slate-400"
                }`}
              >
                {c.trend}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
              <span>Commercial {c.commercialActivity}%</span>
              <span>Commandes {c.ordersActivity}%</span>
              <span>Réseau {c.networkActivity}%</span>
            </div>
            <p className="mt-1 font-mono text-xs text-emerald-400/90">+{c.growthPct}% croissance locale</p>
          </li>
        ))}
      </ul>
    </ProducerTerritoryPanelFrame>
  );
}

export const ProducerTerritoryActivityPanel = memo(TerritoryActivityInner);
