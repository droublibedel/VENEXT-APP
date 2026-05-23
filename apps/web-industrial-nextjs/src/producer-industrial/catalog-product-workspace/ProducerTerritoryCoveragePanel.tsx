"use client";

import { memo, useState } from "react";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import type { ProducerMapControlDto } from "../data/producer-industrial-data.types";
import type { CatalogPanelProps, ProducerCatalogWorkspaceView } from "./producer-catalog.types";
import { ProducerCatalogPanelFrame } from "./ProducerCatalogPanelFrame";

type CatalogMapLayer = "productCoverage" | "highDemand" | "lowAvailability" | "activeDistribution";

const LAYERS: { id: CatalogMapLayer; label: string }[] = [
  { id: "productCoverage", label: "Couverture produit" },
  { id: "highDemand", label: "Forte demande" },
  { id: "lowAvailability", label: "Faible disponibilité" },
  { id: "activeDistribution", label: "Distribution active" },
];

function TerritoryCoverageInner(
  props: CatalogPanelProps & {
    view: ProducerCatalogWorkspaceView | null;
    map: ProducerMapControlDto | null;
  },
) {
  const { view, map, loading, error, dataSource, fallbackUsed } = props;
  const [layer, setLayer] = useState<CatalogMapLayer>("productCoverage");

  return (
    <ProducerCatalogPanelFrame
      title="Couverture territoriale"
      subtitle="Abidjan, Bouaké, Korhogo, San Pedro, Yamoussoukro"
      loading={loading}
      error={error}
      empty={!map?.regions?.length && !view}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-territory-coverage-panel"
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
        data={map ?? undefined}
        dataSource={dataSource}
        testId="catalog-territory-map"
      />
    </ProducerCatalogPanelFrame>
  );
}

export const ProducerTerritoryCoveragePanel = memo(TerritoryCoverageInner);
