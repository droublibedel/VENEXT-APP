"use client";

import { memo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { RelationalCommercialWorkspaceView } from "./relational-commercial-workspace.types";
import { RelationalPanelFrame } from "./RelationalPanelFrame";

const STATUS_LABEL: Record<string, string> = {
  tension: "Sous tension",
  stable: "Stable",
  croissance: "Forte croissance",
  dependant: "Dépendant",
  critique: "Critique",
};

function CorridorPressurePanelInner(props: {
  view: RelationalCommercialWorkspaceView | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
}) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const corridors = view?.corridors ?? [];

  const groups = {
    tension: corridors.filter((c) => c.status === "tension" || c.status === "critique"),
    stable: corridors.filter((c) => c.status === "stable"),
    croissance: corridors.filter((c) => c.status === "croissance"),
    dependant: corridors.filter((c) => c.status === "dependant"),
    critique: corridors.filter((c) => c.status === "critique"),
  };

  return (
    <RelationalPanelFrame
      title="Pression corridors"
      subtitle="Tensions supply et dynamique commerciale par axe"
      loading={loading}
      error={error}
      empty={!corridors.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="relational-corridor-pressure-panel"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {(
          [
            ["Sous tension", groups.tension],
            ["Stables", groups.stable],
            ["Forte croissance", groups.croissance],
            ["Dépendants", groups.dependant],
          ] as const
        ).map(([title, list]) => (
          <div key={title} className="rounded border border-slate-800/70 bg-slate-950/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <ul className="mt-2 space-y-1.5">
              {list.length === 0 ? (
                <li className="text-[11px] text-slate-600">—</li>
              ) : (
                list.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-xs text-slate-300">
                    <span>{c.label}</span>
                    <span className="font-mono text-[10px] text-emerald-400/80">
                      {STATUS_LABEL[c.status]} · {c.pressurePct}%
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
    </RelationalPanelFrame>
  );
}

export const RelationalCorridorPressurePanel = memo(CorridorPressurePanelInner);
