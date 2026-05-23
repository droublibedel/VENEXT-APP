"use client";

import { memo, useState } from "react";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import type { IntelligencePanelProps, ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";
import { ProducerIntelligencePanelFrame } from "./ProducerIntelligencePanelFrame";

type IntelMapLayer =
  | "intelligentSignals"
  | "activeAttention"
  | "monitoredZones"
  | "corridorWatch"
  | "networkMomentum";

const LAYERS: { id: IntelMapLayer; label: string }[] = [
  { id: "intelligentSignals", label: "Signaux terrain" },
  { id: "activeAttention", label: "Attention active" },
  { id: "monitoredZones", label: "Zones suivies" },
  { id: "corridorWatch", label: "Veille corridor" },
  { id: "networkMomentum", label: "Momentum réseau" },
];

function CorridorWatchInner(
  props: IntelligencePanelProps & { view: ProducerIntelligenceWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [layer, setLayer] = useState<IntelMapLayer>("intelligentSignals");

  return (
    <ProducerIntelligencePanelFrame
      title="Veille corridors"
      subtitle="Abidjan, Bouaké, Korhogo, San Pedro, Yamoussoukro, Man"
      loading={loading}
      error={error}
      empty={!view?.map?.regions?.length && !view}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-corridor-watch-panel"
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
        testId="intelligence-corridor-map"
      />
    </ProducerIntelligencePanelFrame>
  );
}

export const ProducerCorridorWatchPanel = memo(CorridorWatchInner);
