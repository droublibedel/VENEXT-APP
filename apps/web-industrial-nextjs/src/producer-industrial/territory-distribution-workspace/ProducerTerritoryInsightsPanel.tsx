"use client";

import { memo } from "react";

import type { ProducerTerritoryWorkspaceView, TerritoryPanelProps } from "./producer-territory.types";
import { ProducerTerritoryPanelFrame } from "./ProducerTerritoryPanelFrame";

function TerritoryInsightsInner(
  props: TerritoryPanelProps & { view: ProducerTerritoryWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerTerritoryPanelFrame
      title="Insights territoires"
      subtitle="Lecture courte — villes, corridors et couverture"
      loading={loading}
      error={error}
      empty={!view?.insights.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-territory-insights-panel"
    >
      <ul className="grid gap-2 md:grid-cols-2">
        {view?.insights.map((item) => (
          <li
            key={item.id}
            className={`rounded border px-3 py-2 ${
              item.priority === "high"
                ? "border-rose-500/30 bg-rose-950/15"
                : item.priority === "medium"
                  ? "border-amber-500/25 bg-amber-950/12"
                  : "border-slate-800/60 bg-slate-950/40"
            }`}
            data-testid={`territory-insight-${item.id}`}
          >
            <p className="text-sm text-slate-100">{item.line1}</p>
            {item.line2 ? <p className="mt-0.5 text-[11px] text-slate-500">{item.line2}</p> : null}
          </li>
        ))}
      </ul>
    </ProducerTerritoryPanelFrame>
  );
}

export const ProducerTerritoryInsightsPanel = memo(TerritoryInsightsInner);
