"use client";

import { memo, useState } from "react";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import type { MarketingPanelProps, ProducerMarketingWorkspaceView } from "./producer-marketing.types";
import { ProducerMarketingPanelFrame } from "./ProducerMarketingPanelFrame";

type MarketingMapLayer =
  | "activationZones"
  | "productMomentum"
  | "highResponse"
  | "weakCoverage"
  | "distributorPush";

const LAYERS: { id: MarketingMapLayer; label: string }[] = [
  { id: "activationZones", label: "Zones activation" },
  { id: "productMomentum", label: "Momentum produit" },
  { id: "highResponse", label: "Forte réponse" },
  { id: "weakCoverage", label: "Couverture faible" },
  { id: "distributorPush", label: "Push distributeur" },
];

function ActivationTerritoryInner(
  props: MarketingPanelProps & { view: ProducerMarketingWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [layer, setLayer] = useState<MarketingMapLayer>("activationZones");

  return (
    <ProducerMarketingPanelFrame
      title="Activation territoriale"
      subtitle="Abidjan, Bouaké, Korhogo, San Pedro, Yamoussoukro, Man"
      loading={loading}
      error={error}
      empty={!view?.map?.regions?.length && !view}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-activation-territory-panel"
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
        testId="marketing-activation-map"
      />
    </ProducerMarketingPanelFrame>
  );
}

export const ProducerActivationTerritoryPanel = memo(ActivationTerritoryInner);
