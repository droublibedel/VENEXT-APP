"use client";

import { memo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { RelationalCommercialWorkspaceView } from "./relational-commercial-workspace.types";
import { RelationalPanelFrame } from "./RelationalPanelFrame";

function CommercialInsightsPanelInner(props: {
  view: RelationalCommercialWorkspaceView | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
}) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const insights = view?.insights ?? [];

  return (
    <RelationalPanelFrame
      title="Insights réseau"
      subtitle="Lecture terrain — phrases actionnables"
      loading={loading}
      error={error}
      empty={!insights.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="relational-commercial-insights-panel"
    >
      <ul className="space-y-2">
        {insights.map((item) => (
          <li
            key={item.id}
            className={`rounded border-l-2 px-3 py-2 text-sm ${
              item.priority === "high"
                ? "border-rose-500/50 bg-rose-950/20 text-rose-100"
                : item.priority === "medium"
                  ? "border-amber-500/40 bg-amber-950/15 text-amber-50"
                  : "border-emerald-500/30 bg-emerald-950/10 text-emerald-50"
            }`}
            data-testid={`relational-insight-${item.id}`}
          >
            {item.text}
          </li>
        ))}
      </ul>
    </RelationalPanelFrame>
  );
}

export const RelationalCommercialInsightsPanel = memo(CommercialInsightsPanelInner);
