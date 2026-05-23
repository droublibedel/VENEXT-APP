"use client";

import { memo } from "react";

import type { ProducerTerritoryWorkspaceView, TerritoryPanelProps } from "./producer-territory.types";
import { ProducerTerritoryPanelFrame } from "./ProducerTerritoryPanelFrame";

function TerritoryOverviewInner(
  props: TerritoryPanelProps & { view: ProducerTerritoryWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerTerritoryPanelFrame
      title="Vue territoires"
      subtitle="Activité réseau, corridors et zones à renforcer"
      loading={loading}
      error={error}
      empty={!view?.overview.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-territory-overview-panel"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {view?.overview.map((m) => (
          <article
            key={m.id}
            className={`rounded-lg border px-3 py-3 ${
              m.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/15"
                : m.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/12"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-1 font-mono text-xl text-slate-100">{m.value}</p>
            {m.hint ? <p className="mt-1 text-[10px] text-slate-600">{m.hint}</p> : null}
          </article>
        ))}
      </div>
    </ProducerTerritoryPanelFrame>
  );
}

export const ProducerTerritoryOverviewPanel = memo(TerritoryOverviewInner);
