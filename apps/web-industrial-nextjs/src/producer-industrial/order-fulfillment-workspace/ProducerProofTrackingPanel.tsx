"use client";

import { memo } from "react";

import type { FulfillmentPanelProps, ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";
import { ProducerFulfillmentPanelFrame } from "./ProducerFulfillmentPanelFrame";

const STATUS_STYLE: Record<string, string> = {
  reçu: "text-sky-400",
  confirmé: "text-emerald-400",
  validé: "text-emerald-300",
  anomalie: "text-amber-400",
  manquant: "text-rose-400",
};

function ProofTrackingInner(
  props: FulfillmentPanelProps & { view: ProducerOrderFulfillmentView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const proofs = view?.proofs ?? [];

  return (
    <ProducerFulfillmentPanelFrame
      title="Preuves terrain"
      subtitle="Réceptions, confirmations et validations réseau"
      loading={loading}
      error={error}
      empty={!proofs.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-proof-tracking-panel"
    >
      <ul className="divide-y divide-slate-800/60 rounded border border-slate-800/60">
        {proofs.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs">
            <div>
              <p className="font-medium text-slate-200">
                {p.label} — {p.partner}
              </p>
              <p className="text-[10px] text-slate-500">
                {p.city} · {p.at}
              </p>
            </div>
            <span className={`text-[10px] uppercase ${STATUS_STYLE[p.status] ?? "text-slate-400"}`}>
              {p.status}
            </span>
          </li>
        ))}
      </ul>
    </ProducerFulfillmentPanelFrame>
  );
}

export const ProducerProofTrackingPanel = memo(ProofTrackingInner);
