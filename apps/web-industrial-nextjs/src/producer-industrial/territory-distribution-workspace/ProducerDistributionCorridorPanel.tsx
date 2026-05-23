"use client";

import { memo, useState } from "react";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import type { ProducerTerritoryWorkspaceView, TerritoryPanelProps } from "./producer-territory.types";
import { ProducerTerritoryPanelFrame } from "./ProducerTerritoryPanelFrame";

type TerritoryMapLayer =
  | "distributionCoverage"
  | "activeCorridors"
  | "highActivity"
  | "lowCoverage"
  | "logisticsPressure";

const LAYERS: { id: TerritoryMapLayer; label: string }[] = [
  { id: "distributionCoverage", label: "Couverture distribution" },
  { id: "activeCorridors", label: "Corridors actifs" },
  { id: "highActivity", label: "Forte activité" },
  { id: "lowCoverage", label: "Couverture faible" },
  { id: "logisticsPressure", label: "Pression logistique" },
];

function DistributionCorridorInner(
  props: TerritoryPanelProps & { view: ProducerTerritoryWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [layer, setLayer] = useState<TerritoryMapLayer>("distributionCoverage");
  const corridors = view?.corridors ?? [];

  return (
    <ProducerTerritoryPanelFrame
      title="Corridors & distribution"
      subtitle="Abidjan, Bouaké, Korhogo, San Pedro, Yamoussoukro, Man"
      loading={loading}
      error={error}
      empty={!corridors.length && !view?.map}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-distribution-corridor-panel"
    >
      <div className="mb-3 flex flex-wrap gap-1">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLayer(l.id)}
            className={`rounded px-2 py-1 text-[10px] ${
              layer === l.id ? "bg-emerald-500/15 text-emerald-300" : "text-slate-500 hover:bg-slate-900"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <IndustrialMapControlSystem
        layer={layer}
        data={view?.map ?? undefined}
        dataSource={dataSource}
        testId="territory-distribution-map"
      />
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {corridors.map((c) => (
          <li
            key={c.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"
          >
            <p className="font-medium text-slate-100">{c.label}</p>
            <p className="mt-1 font-mono text-emerald-400/90">
              Activité {c.activityPct}% · Stabilité {c.stability}%
            </p>
            <p className="mt-0.5 capitalize text-slate-500">
              {c.status} · {c.coverage}
            </p>
          </li>
        ))}
      </ul>
    </ProducerTerritoryPanelFrame>
  );
}

export const ProducerDistributionCorridorPanel = memo(DistributionCorridorInner);
