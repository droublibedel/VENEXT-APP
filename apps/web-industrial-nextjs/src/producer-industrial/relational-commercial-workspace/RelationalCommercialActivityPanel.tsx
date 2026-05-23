"use client";

import { memo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { RelationalCommercialWorkspaceView } from "./relational-commercial-workspace.types";
import { RelationalPanelFrame } from "./RelationalPanelFrame";

function CommercialActivityPanelInner(props: {
  view: RelationalCommercialWorkspaceView | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
}) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <RelationalPanelFrame
      title="Activité réseau"
      subtitle="Villes, corridors et rythme des commandes"
      loading={loading}
      error={error}
      empty={!view}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="relational-commercial-activity-panel"
    >
      {view ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded border border-slate-800/60 px-3 py-2">
              <p className="text-[10px] text-slate-500">Commandes récentes</p>
              <p className="mt-1 font-semibold text-slate-100">{view.recentOrdersLabel}</p>
            </div>
            <div className="rounded border border-slate-800/60 px-3 py-2">
              <p className="text-[10px] text-slate-500">Croissance réseau</p>
              <p className="mt-1 font-semibold text-emerald-400">+{view.networkGrowthPct.toFixed(1)}%</p>
            </div>
            <div className="rounded border border-slate-800/60 px-3 py-2">
              <p className="text-[10px] text-slate-500">Zones silencieuses</p>
              <p className="mt-1 text-slate-200">{view.silentZones.join(", ") || "Aucune"}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Par ville</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {view.activityByCity.map((row) => (
                  <li key={row.city} className="flex justify-between border-b border-slate-800/40 py-1">
                    <span>{row.city}</span>
                    <span className="font-mono text-slate-400">
                      {row.orders7d.toLocaleString("fr-FR")} · +{row.growthPct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Par corridor</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {view.activityByCorridor.map((row) => (
                  <li key={row.corridor} className="flex justify-between border-b border-slate-800/40 py-1">
                    <span>{row.corridor}</span>
                    <span className="font-mono text-slate-400">{row.orders7d.toLocaleString("fr-FR")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-800/60 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Timeline réseau</p>
            <ol className="relative border-l border-slate-700/60 pl-4">
              {view.timeline.map((point) => (
                <li key={point.id} className="mb-3 ml-1">
                  <span className="absolute -left-1.5 mt-1 h-2 w-2 rounded-full bg-emerald-500/80" />
                  <p className="text-xs text-slate-200">{point.label}</p>
                  <p className="text-[10px] text-emerald-400/90">{point.value}</p>
                  <p className="text-[10px] text-slate-600">{point.at}</p>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : null}
    </RelationalPanelFrame>
  );
}

export const RelationalCommercialActivityPanel = memo(CommercialActivityPanelInner);
