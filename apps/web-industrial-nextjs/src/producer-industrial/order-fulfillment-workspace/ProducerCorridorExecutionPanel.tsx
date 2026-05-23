"use client";

import { memo } from "react";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import type { FulfillmentPanelProps, ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";
import { ProducerFulfillmentPanelFrame } from "./ProducerFulfillmentPanelFrame";

function CorridorExecutionInner(
  props: FulfillmentPanelProps & { view: ProducerOrderFulfillmentView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const corridors = view?.corridors ?? [];

  return (
    <ProducerFulfillmentPanelFrame
      title="Exécution corridors"
      subtitle="Stabilité, saturation et performance territoriale"
      loading={loading}
      error={error}
      empty={!corridors.length && !view?.map}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-corridor-execution-panel"
    >
      <div className="mb-4">
        <IndustrialMapControlSystem
          layer="supply"
          data={view?.map ?? undefined}
          dataSource={dataSource}
          testId="fulfillment-corridor-map"
        />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {corridors.map((c) => (
          <li
            key={c.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"
          >
            <p className="font-medium text-slate-100">{c.label}</p>
            <p className="mt-1 text-[10px] text-slate-500">{c.territory}</p>
            <p className="mt-1 font-mono text-emerald-400/90">
              Exécution {c.executionPct}% · Stabilité {c.stability}%
            </p>
            <p className="mt-0.5 capitalize text-slate-500">{c.status}</p>
          </li>
        ))}
      </ul>
    </ProducerFulfillmentPanelFrame>
  );
}

export const ProducerCorridorExecutionPanel = memo(CorridorExecutionInner);
