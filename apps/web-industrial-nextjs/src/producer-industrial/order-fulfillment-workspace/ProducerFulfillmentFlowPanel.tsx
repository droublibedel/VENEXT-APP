"use client";

import { memo } from "react";

import type { FulfillmentPanelProps, ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";
import { ProducerFulfillmentPanelFrame } from "./ProducerFulfillmentPanelFrame";

function FulfillmentFlowInner(
  props: FulfillmentPanelProps & { view: ProducerOrderFulfillmentView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const flows = view?.fulfillmentFlows ?? [];

  return (
    <ProducerFulfillmentPanelFrame
      title="Flux fulfillment"
      subtitle="Progression, hubs et congestion — exécution réseau"
      loading={loading}
      error={error}
      empty={!flows.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-fulfillment-flow-panel"
    >
      <div className="grid gap-2 md:grid-cols-2">
        {flows.map((f) => (
          <article
            key={f.id}
            className={`rounded-lg border px-3 py-3 ${
              f.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/15"
                : f.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/12"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-slate-500">{f.title}</p>
            <p className="mt-1 text-xs text-slate-200">{f.detail}</p>
            {f.progressPct != null ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500/80"
                  style={{ width: `${f.progressPct}%` }}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </ProducerFulfillmentPanelFrame>
  );
}

export const ProducerFulfillmentFlowPanel = memo(FulfillmentFlowInner);
