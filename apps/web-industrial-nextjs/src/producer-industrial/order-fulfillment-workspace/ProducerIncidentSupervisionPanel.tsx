"use client";

import { memo } from "react";

import type { FulfillmentPanelProps, ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";
import { ProducerFulfillmentPanelFrame } from "./ProducerFulfillmentPanelFrame";

const PRIORITY_CLASS = {
  critique: "border-rose-500/40 bg-rose-950/25 text-rose-100",
  warning: "border-amber-500/35 bg-amber-950/20 text-amber-50",
  stable: "border-slate-700/50 bg-slate-950/30 text-slate-300",
} as const;

function IncidentSupervisionInner(
  props: FulfillmentPanelProps & { view: ProducerOrderFulfillmentView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const incidents = view?.incidents ?? [];

  return (
    <ProducerFulfillmentPanelFrame
      title="Supervision incidents"
      subtitle="Retards, blocages et corridors perturbés"
      loading={loading}
      error={error}
      empty={!incidents.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-incident-supervision-panel"
    >
      <ul className="space-y-2">
        {incidents.map((inc) => (
          <li
            key={inc.id}
            className={`rounded border-l-2 px-3 py-2 ${PRIORITY_CLASS[inc.priority]}`}
          >
            <p className="text-sm font-medium">{inc.title}</p>
            <p className="mt-0.5 text-[10px] opacity-80">
              {inc.zone} · {inc.corridor}
            </p>
            <p className="mt-1 text-[11px] text-emerald-400/80">{inc.action}</p>
          </li>
        ))}
      </ul>
    </ProducerFulfillmentPanelFrame>
  );
}

export const ProducerIncidentSupervisionPanel = memo(IncidentSupervisionInner);
