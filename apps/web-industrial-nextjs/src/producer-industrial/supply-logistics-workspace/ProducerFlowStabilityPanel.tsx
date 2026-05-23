"use client";

import { memo } from "react";

import type { ProducerSupplyWorkspaceView, SupplyPanelProps } from "./producer-supply.types";
import { ProducerSupplyPanelFrame } from "./ProducerSupplyPanelFrame";

function FlowStabilityInner(props: SupplyPanelProps & { view: ProducerSupplyWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerSupplyPanelFrame
      title="Stabilité des flux"
      subtitle="Vitesses, congestions et corridors critiques"
      loading={loading}
      error={error}
      empty={!view?.flows.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-flow-stability-panel"
    >
      <ul className="space-y-2">
        {view?.flows.map((f) => (
          <li
            key={f.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2"
            data-testid={`supply-flow-${f.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-100">{f.label}</p>
              <span
                className={`rounded px-2 py-0.5 text-[10px] capitalize ${
                  f.speed === "rapide"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : f.speed === "ralenti"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-slate-800 text-slate-400"
                }`}
              >
                {f.speed}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {f.congestion} · {f.delayRisk} · {f.corridorNote}
            </p>
          </li>
        ))}
      </ul>
    </ProducerSupplyPanelFrame>
  );
}

export const ProducerFlowStabilityPanel = memo(FlowStabilityInner);
