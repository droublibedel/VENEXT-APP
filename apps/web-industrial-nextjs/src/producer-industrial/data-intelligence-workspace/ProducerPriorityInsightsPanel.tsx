"use client";

import { memo } from "react";

import type { IntelligencePanelProps, ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";
import { ProducerIntelligencePanelFrame } from "./ProducerIntelligencePanelFrame";

function PriorityInsightsInner(
  props: IntelligencePanelProps & { view: ProducerIntelligenceWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerIntelligencePanelFrame
      title="Insights prioritaires"
      subtitle="Ce qui mérite votre attention en premier"
      loading={loading}
      error={error}
      empty={!view?.priorityInsights.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-priority-insights-panel"
    >
      <ul className="grid gap-2 md:grid-cols-2">
        {view?.priorityInsights.map((item) => (
          <li
            key={item.id}
            className={`rounded border px-3 py-2 ${
              item.priority === "high"
                ? "border-rose-500/25 bg-rose-950/12"
                : item.priority === "medium"
                  ? "border-amber-500/20 bg-amber-950/10"
                  : "border-slate-800/60 bg-slate-950/40"
            }`}
            data-testid={`priority-insight-${item.id}`}
          >
            <p className="text-sm text-slate-100">{item.line1}</p>
            {item.line2 ? <p className="mt-0.5 text-[11px] text-slate-500">{item.line2}</p> : null}
          </li>
        ))}
      </ul>
    </ProducerIntelligencePanelFrame>
  );
}

export const ProducerPriorityInsightsPanel = memo(PriorityInsightsInner);
