"use client";

import { memo, useMemo } from "react";

import { buildDeliverySignals } from "./relational-order-intelligence";
import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderDeliveryPanelInner({ order }: { order: RelationalCommercialOrder }) {
  const signals = useMemo(() => buildDeliverySignals(order), [order]);

  return (
    <section className="roo-panel" data-testid="roo-delivery-panel">
      <h4 className="roo-panel-title">Livraison</h4>
      <p className="roo-panel-text">Livraison légère — confirmation terrain simple</p>
      <ul className="roo-hints">
        {signals.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}

export const RelationalOrderDeliveryPanel = memo(RelationalOrderDeliveryPanelInner);
