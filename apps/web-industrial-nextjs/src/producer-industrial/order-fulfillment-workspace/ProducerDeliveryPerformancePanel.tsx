"use client";

import { memo } from "react";

import type { FulfillmentPanelProps, ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";
import { ProducerFulfillmentPanelFrame } from "./ProducerFulfillmentPanelFrame";

function DeliveryPerformanceInner(
  props: FulfillmentPanelProps & { view: ProducerOrderFulfillmentView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerFulfillmentPanelFrame
      title="Performance livraison"
      subtitle="Délais, corridors et exécution par ville"
      loading={loading}
      error={error}
      empty={!view?.deliveryMetrics.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-delivery-performance-panel"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {view?.deliveryMetrics.map((m) => (
          <div key={m.id} className="rounded-lg border border-slate-800/70 bg-slate-950/50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400/95">{m.value}</p>
            {m.hint ? <p className="mt-1 text-[10px] text-slate-600">{m.hint}</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Exécution par ville</p>
        <ul className="space-y-1 text-xs text-slate-300">
          {view?.deliveryByCity.map((row) => (
            <li key={row.city} className="flex justify-between border-b border-slate-800/40 py-1.5">
              <span>{row.city}</span>
              <span className="font-mono text-slate-400">
                {row.avgDays} j · {row.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ProducerFulfillmentPanelFrame>
  );
}

export const ProducerDeliveryPerformancePanel = memo(DeliveryPerformanceInner);
