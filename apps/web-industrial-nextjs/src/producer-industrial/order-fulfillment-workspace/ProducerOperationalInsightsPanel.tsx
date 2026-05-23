"use client";

import { memo } from "react";

import type { FulfillmentPanelProps, ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";
import { ProducerFulfillmentPanelFrame } from "./ProducerFulfillmentPanelFrame";

function OperationalInsightsInner(
  props: FulfillmentPanelProps & { view: ProducerOrderFulfillmentView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const insights = view?.insights ?? [];

  return (
    <ProducerFulfillmentPanelFrame
      title="Insights opérationnels"
      subtitle="Lecture humaine de l'exécution réseau"
      loading={loading}
      error={error}
      empty={!insights.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-operational-insights-panel"
    >
      <ul className="space-y-2">
        {insights.map((item) => (
          <li
            key={item.id}
            className={`rounded border-l-2 px-3 py-2 text-sm ${
              item.priority === "high"
                ? "border-rose-500/50 bg-rose-950/20 text-rose-50"
                : item.priority === "medium"
                  ? "border-amber-500/40 bg-amber-950/15 text-amber-50"
                  : "border-emerald-500/30 bg-emerald-950/10 text-emerald-50"
            }`}
            data-testid={`fulfillment-insight-${item.id}`}
          >
            {item.text}
          </li>
        ))}
      </ul>
    </ProducerFulfillmentPanelFrame>
  );
}

export const ProducerOperationalInsightsPanel = memo(OperationalInsightsInner);
