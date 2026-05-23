"use client";

import { memo, useState } from "react";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import type { ProducerSupplyWorkspaceView, SupplyPanelProps } from "./producer-supply.types";
import { ProducerSupplyPanelFrame } from "./ProducerSupplyPanelFrame";

type SupplyMapLayer =
  | "logisticsFlow"
  | "deliveryPressure"
  | "activeHubs"
  | "stableCorridors"
  | "slowExecution";

const LAYERS: { id: SupplyMapLayer; label: string }[] = [
  { id: "logisticsFlow", label: "Flux logistique" },
  { id: "deliveryPressure", label: "Pression livraison" },
  { id: "activeHubs", label: "Hubs actifs" },
  { id: "stableCorridors", label: "Corridors stables" },
  { id: "slowExecution", label: "Exécution lente" },
];

function SupplyCoverageInner(props: SupplyPanelProps & { view: ProducerSupplyWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [layer, setLayer] = useState<SupplyMapLayer>("logisticsFlow");

  return (
    <ProducerSupplyPanelFrame
      title="Couverture logistique"
      subtitle="Abidjan, Bouaké, Korhogo, San Pedro, Yamoussoukro, Man"
      loading={loading}
      error={error}
      empty={!view?.map?.regions?.length && !view}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-supply-coverage-panel"
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
        testId="supply-logistics-map"
      />
    </ProducerSupplyPanelFrame>
  );
}

export const ProducerSupplyCoveragePanel = memo(SupplyCoverageInner);
