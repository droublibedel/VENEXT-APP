"use client";

import { memo, useMemo } from "react";

import { buildDeliverySignals } from "./relational-order-intelligence";
import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderShipmentPanelInner({ order }: { order: RelationalCommercialOrder }) {
  const signals = useMemo(() => buildDeliverySignals(order), [order]);

  return (
    <section className="roo-panel" data-testid="roo-shipment-panel">
      <h4 className="roo-panel-title">Expédition</h4>
      <p className="roo-panel-text">Mise en route vers {order.city}</p>
      <ul className="roo-hints">
        {signals.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}

export const RelationalOrderShipmentPanel = memo(RelationalOrderShipmentPanelInner);
