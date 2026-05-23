"use client";

import { memo } from "react";

import type { ProducerSupplyWorkspaceView, SupplyPanelProps } from "./producer-supply.types";
import { ProducerSupplyPanelFrame } from "./ProducerSupplyPanelFrame";

function DeliveryTensionInner(props: SupplyPanelProps & { view: ProducerSupplyWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerSupplyPanelFrame
      title="Tensions livraison"
      subtitle="Retards, hubs sous pression et exécution terrain"
      loading={loading}
      error={error}
      empty={!view?.deliveryTension.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-delivery-tension-panel"
    >
      <ul className="space-y-2">
        {view?.deliveryTension.map((item) => (
          <li
            key={item.id}
            className={`rounded border-l-2 px-3 py-2 ${
              item.tone === "caution"
                ? "border-amber-500/50 bg-amber-950/12"
                : item.tone === "signal"
                  ? "border-emerald-500/40 bg-emerald-950/10"
                  : "border-slate-700/40 bg-slate-950/30"
            }`}
            data-testid={`supply-delivery-${item.id}`}
          >
            <p className="text-sm font-medium text-slate-100">{item.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{item.detail}</p>
          </li>
        ))}
      </ul>
    </ProducerSupplyPanelFrame>
  );
}

export const ProducerDeliveryTensionPanel = memo(DeliveryTensionInner);
