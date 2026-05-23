"use client";

import { memo } from "react";

import type { ProducerSupplyWorkspaceView, SupplyPanelProps } from "./producer-supply.types";
import { ProducerSupplyPanelFrame } from "./ProducerSupplyPanelFrame";

function SupplyInsightsInner(props: SupplyPanelProps & { view: ProducerSupplyWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerSupplyPanelFrame
      title="Insights logistiques"
      subtitle="Hubs, corridors et opportunités terrain"
      loading={loading}
      error={error}
      empty={!view?.insights.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-supply-insights-panel"
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
            data-testid={`supply-insight-${item.id}`}
          >
            <p className="text-sm text-slate-100">{item.line1}</p>
            {item.line2 ? <p className="mt-0.5 text-[11px] text-slate-500">{item.line2}</p> : null}
          </li>
        ))}
      </ul>
    </ProducerSupplyPanelFrame>
  );
}

export const ProducerSupplyInsightsPanel = memo(SupplyInsightsInner);
