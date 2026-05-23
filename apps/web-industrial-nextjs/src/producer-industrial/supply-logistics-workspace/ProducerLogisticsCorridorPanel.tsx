"use client";

import { memo } from "react";

import type { ProducerSupplyWorkspaceView, SupplyPanelProps } from "./producer-supply.types";
import { ProducerSupplyPanelFrame } from "./ProducerSupplyPanelFrame";

function LogisticsCorridorInner(props: SupplyPanelProps & { view: ProducerSupplyWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerSupplyPanelFrame
      title="Corridors logistiques"
      subtitle="Flux fluides, ralentissements et pression transport"
      loading={loading}
      error={error}
      empty={!view?.corridors.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-logistics-corridor-panel"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {view?.corridors.map((c) => (
          <li
            key={c.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"
            data-testid={`supply-corridor-${c.id}`}
          >
            <p className="font-medium text-slate-100">{c.label}</p>
            <p className="mt-1 font-mono text-emerald-400/90">
              Transport {c.transportActivity}% · Exécution {c.executionStability}%
            </p>
            <p className="mt-0.5 capitalize text-slate-500">
              {c.status} · Pression {c.logisticsPressure}
            </p>
          </li>
        ))}
      </ul>
    </ProducerSupplyPanelFrame>
  );
}

export const ProducerLogisticsCorridorPanel = memo(LogisticsCorridorInner);
