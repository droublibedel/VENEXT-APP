"use client";

import { memo } from "react";

import type { CatalogPanelProps, ProducerCatalogWorkspaceView } from "./producer-catalog.types";
import { ProducerCatalogPanelFrame } from "./ProducerCatalogPanelFrame";

function DemandPressureInner(
  props: CatalogPanelProps & { view: ProducerCatalogWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerCatalogPanelFrame
      title="Tension demande"
      subtitle="Pression terrain, hausse d'activité et zones sensibles"
      loading={loading}
      error={error}
      empty={!view?.demandZones.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-demand-pressure-panel"
    >
      <ul className="space-y-2">
        {view?.demandZones.map((z) => (
          <li
            key={z.id}
            className={`flex items-center gap-3 rounded border px-3 py-2 ${
              z.risk === "rupture"
                ? "border-rose-500/35 bg-rose-950/20"
                : z.risk === "tension"
                  ? "border-amber-500/30 bg-amber-950/15"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
          >
            <div className="min-w-[72px] text-xs font-medium text-slate-200">{z.label}</div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  z.risk === "rupture" ? "bg-rose-500/80" : z.risk === "tension" ? "bg-amber-500/70" : "bg-emerald-500/70"
                }`}
                style={{ width: `${z.pressurePct}%` }}
              />
            </div>
            <span className="w-16 text-right font-mono text-[10px] text-slate-400">{z.pressurePct}%</span>
            <span className="w-14 text-[10px] capitalize text-slate-500">{z.trend}</span>
          </li>
        ))}
      </ul>
    </ProducerCatalogPanelFrame>
  );
}

export const ProducerDemandPressurePanel = memo(DemandPressureInner);
