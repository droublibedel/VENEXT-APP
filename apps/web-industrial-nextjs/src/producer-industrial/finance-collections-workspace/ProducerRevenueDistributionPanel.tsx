"use client";

import { memo, useState } from "react";

import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import type { FinancePanelProps, ProducerFinanceWorkspaceView } from "./producer-finance.types";
import { ProducerFinancePanelFrame } from "./ProducerFinancePanelFrame";

type FinanceMapLayer =
  | "revenueDistribution"
  | "stableZones"
  | "delayedZones"
  | "highCollections"
  | "lowCollections";

const LAYERS: { id: FinanceMapLayer; label: string }[] = [
  { id: "revenueDistribution", label: "Répartition revenus" },
  { id: "stableZones", label: "Zones stables" },
  { id: "delayedZones", label: "Zones en retard" },
  { id: "highCollections", label: "Forts encaissements" },
  { id: "lowCollections", label: "Encaissements faibles" },
];

function RevenueDistributionInner(props: FinancePanelProps & { view: ProducerFinanceWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [layer, setLayer] = useState<FinanceMapLayer>("revenueDistribution");

  return (
    <ProducerFinancePanelFrame
      title="Répartition revenus"
      subtitle="Abidjan, Bouaké, Korhogo, San Pedro, Yamoussoukro, Man"
      loading={loading}
      error={error}
      empty={!view?.map?.regions?.length && !view}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-revenue-distribution-panel"
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
        testId="finance-revenue-map"
      />
    </ProducerFinancePanelFrame>
  );
}

export const ProducerRevenueDistributionPanel = memo(RevenueDistributionInner);
