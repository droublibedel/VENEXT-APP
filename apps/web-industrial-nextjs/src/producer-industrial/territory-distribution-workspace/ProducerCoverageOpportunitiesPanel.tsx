"use client";

import { memo } from "react";

import type { ProducerTerritoryWorkspaceView, TerritoryPanelProps } from "./producer-territory.types";
import { ProducerTerritoryPanelFrame } from "./ProducerTerritoryPanelFrame";

function CoverageOpportunitiesInner(
  props: TerritoryPanelProps & { view: ProducerTerritoryWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerTerritoryPanelFrame
      title="Couverture & opportunités"
      subtitle="Recommandations terrain — règles déterministes"
      loading={loading}
      error={error}
      empty={!view?.opportunities.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-coverage-opportunities-panel"
    >
      <ul className="space-y-2">
        {view?.opportunities.map((o) => (
          <li
            key={o.id}
            className={`rounded border-l-2 px-3 py-2 text-sm ${
              o.priority === "high"
                ? "border-emerald-500/60 bg-emerald-950/15 text-emerald-50"
                : o.priority === "medium"
                  ? "border-slate-500/40 bg-slate-950/30 text-slate-200"
                  : "border-slate-700/40 text-slate-400"
            }`}
            data-testid={`territory-opportunity-${o.id}`}
          >
            {o.text}
          </li>
        ))}
      </ul>
    </ProducerTerritoryPanelFrame>
  );
}

export const ProducerCoverageOpportunitiesPanel = memo(CoverageOpportunitiesInner);
